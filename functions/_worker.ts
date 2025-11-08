import type {
  ClientToServerMessage,
  EstimationCard,
  RoomSnapshot,
  ServerToClientMessage,
} from "@shared/planning-poker"

interface Env {
  ROOM_STATE: DurableObjectNamespace
  ASSETS: Fetcher
}

const ROOM_HEADER = "x-nightwatch-room-id"

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith("/ws/")) {
      if (request.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 })
      }
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return new Response("Expected WebSocket Upgrade", { status: 426 })
      }

      const roomId = url.pathname.replace(/^\/ws\//, "").split("/")[0]?.trim()
      if (!roomId) {
        return new Response("Room id required", { status: 400 })
      }
      const normalizedRoomId = roomId.toUpperCase()
      const stub = env.ROOM_STATE.get(env.ROOM_STATE.idFromName(normalizedRoomId))
      const headers = new Headers(request.headers)
      headers.set(ROOM_HEADER, normalizedRoomId)
      const forwarded = new Request(request, { headers })
      return stub.fetch(forwarded)
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response("Not found", { status: 404 })
  },
}

type InternalParticipant = {
  id: string
  name: string
  estimate: EstimationCard | null
  joinedAt: number
}

type ConnectionMeta = {
  playerId?: string
}

export class RoomDurableObject {
  private state: DurableObjectState
  private roomId: string
  private participants = new Map<string, InternalParticipant>()
  private ownerId: string | null = null
  private revealed = false
  private round = 1
  private connections = new Map<WebSocket, ConnectionMeta>()
  private socketsByPlayerId = new Map<string, WebSocket>()

  constructor(state: DurableObjectState) {
    this.state = state
    this.roomId = state.id.toString()
  }

  async fetch(request: Request): Promise<Response> {
    this.roomId = request.headers.get(ROOM_HEADER) ?? this.roomId

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket Upgrade", { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    this.handleConnection(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  private handleConnection(socket: WebSocket) {
    socket.accept()
    this.connections.set(socket, {})

    socket.addEventListener("message", event => {
      if (typeof event.data !== "string") return
      this.handleIncomingMessage(socket, event.data)
    })

    const cleanup = () => this.handleDisconnect(socket)
    socket.addEventListener("close", cleanup)
    socket.addEventListener("error", cleanup)
  }

  private handleIncomingMessage(socket: WebSocket, raw: string) {
    let parsed: ClientToServerMessage
    try {
      parsed = JSON.parse(raw) as ClientToServerMessage
    } catch {
      this.sendError(socket, "Invalid payload")
      return
    }

    switch (parsed.type) {
      case "join":
        this.handleJoin(socket, parsed)
        break;
      case "vote":
        this.handleVote(socket, parsed)
        break;
      case "reveal":
        this.handleReveal(socket, parsed.playerId)
        break;
      case "reset":
        this.handleReset(socket, parsed.playerId)
        break;
      case "leave":
        this.handleLeave(socket, parsed.playerId)
        break;
      case "ping":
        socket.send(JSON.stringify({ type: "pong" } satisfies ServerToClientMessage))
        break;
      default:
        this.sendError(socket, "Unsupported message type")
    }
  }

  private handleJoin(socket: WebSocket, payload: Extract<ClientToServerMessage, { type: "join" }>) {
    const name = payload.name?.trim()
    if (!name) {
      this.sendError(socket, "Name is required")
      return
    }

    const playerId = payload.playerId
    const existingSocket = this.socketsByPlayerId.get(playerId)
    if (existingSocket && existingSocket !== socket) {
      existingSocket.close(1000, "Replaced by a new session")
    }

    const participant = this.participants.get(playerId) ?? {
      id: playerId,
      name,
      estimate: null,
      joinedAt: Date.now(),
    }

    participant.name = name.slice(0, 80)
    this.participants.set(playerId, participant)

    const metadata = this.connections.get(socket)
    if (metadata) {
      metadata.playerId = playerId
    }
    this.socketsByPlayerId.set(playerId, socket)

    if (!this.ownerId || !this.participants.has(this.ownerId)) {
      this.ownerId = playerId
    }

    const snapshot = this.serializeRoom()
    socket.send(JSON.stringify({ type: "room:init", room: snapshot, playerId } satisfies ServerToClientMessage))
    this.broadcastState(socket)
  }

  private handleVote(socket: WebSocket, payload: Extract<ClientToServerMessage, { type: "vote" }>) {
    if (!this.ensureParticipant(payload.playerId, socket)) {
      return
    }
    const participant = this.participants.get(payload.playerId)!
    participant.estimate = payload.value
    this.broadcastState()
  }

  private handleReveal(socket: WebSocket, playerId: string) {
    if (!this.assertOwner(socket, playerId)) return
    this.revealed = true
    this.broadcastState()
  }

  private handleReset(socket: WebSocket, playerId: string) {
    if (!this.assertOwner(socket, playerId)) return
    this.revealed = false
    this.round += 1
    this.participants.forEach(participant => {
      participant.estimate = null
    })
    this.broadcastState()
  }

  private handleLeave(socket: WebSocket, playerId: string) {
    this.removeParticipant(playerId)
    socket.close(1000, "Left room")
  }

  private handleDisconnect(socket: WebSocket) {
    const metadata = this.connections.get(socket)
    this.connections.delete(socket)

    if (!metadata?.playerId) {
      return
    }

    if (this.socketsByPlayerId.get(metadata.playerId) === socket) {
      this.socketsByPlayerId.delete(metadata.playerId)
      this.removeParticipant(metadata.playerId)
    }
  }

  private ensureParticipant(playerId: string, socket: WebSocket): boolean {
    if (!this.participants.has(playerId)) {
      this.sendError(socket, "Unknown participant")
      return false
    }
    return true
  }

  private assertOwner(socket: WebSocket, playerId: string): boolean {
    if (!this.ensureParticipant(playerId, socket)) {
      return false
    }
    if (this.ownerId !== playerId) {
      this.sendError(socket, "Only the room owner can perform that action")
      return false
    }
    return true
  }

  private removeParticipant(playerId: string) {
    const existed = this.participants.delete(playerId)
    if (!existed) return

    const existingSocket = this.socketsByPlayerId.get(playerId)
    if (existingSocket) {
      this.socketsByPlayerId.delete(playerId)
      const meta = this.connections.get(existingSocket)
      if (meta && meta.playerId === playerId) {
        meta.playerId = undefined
      }
    }

    if (this.ownerId === playerId) {
      this.ownerId = this.pickNextOwner()
    }

    if (this.participants.size === 0) {
      this.ownerId = null
      this.revealed = false
      this.round = 1
    }

    this.broadcastState()
  }

  private pickNextOwner(): string | null {
    const [next] = [...this.participants.values()].sort((a, b) => a.joinedAt - b.joinedAt)
    return next?.id ?? null
  }

  private serializeRoom(): RoomSnapshot {
    const players = [...this.participants.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map(participant => ({
        id: participant.id,
        name: participant.name,
        estimate: participant.estimate,
        isOwner: participant.id === this.ownerId,
      }))

    return {
      id: this.roomId,
      players,
      revealed: this.revealed,
      round: this.round,
    }
  }

  private broadcastState(skipSocket?: WebSocket) {
    if (this.connections.size === 0) return
    const payload: ServerToClientMessage = {
      type: "room:update",
      room: this.serializeRoom(),
    }
    const message = JSON.stringify(payload)
    for (const socket of this.connections.keys()) {
      if (socket === skipSocket) continue
      try {
        socket.send(message)
      } catch {
        this.handleDisconnect(socket)
      }
    }
  }

  private sendError(socket: WebSocket, message: string) {
    const payload: ServerToClientMessage = {
      type: "error",
      message,
    }
    try {
      socket.send(JSON.stringify(payload))
    } catch {
      socket.close(1011, "Unable to deliver error")
    }
  }
}
