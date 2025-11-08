export type EstimationCard = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | 34 | 55 | 89 | "?"

export interface ParticipantSnapshot {
  id: string
  name: string
  estimate: EstimationCard | null
  isOwner: boolean
}

export interface RoomSnapshot {
  id: string
  players: ParticipantSnapshot[]
  revealed: boolean
  round: number
}

export type ClientToServerMessage =
  | {
      type: "join"
      roomId: string
      playerId: string
      name: string
    }
  | {
      type: "vote"
      playerId: string
      value: EstimationCard
    }
  | {
      type: "reveal"
      playerId: string
    }
  | {
      type: "reset"
      playerId: string
    }
  | {
      type: "leave"
      playerId: string
    }
  | {
      type: "ping"
    }

export type ServerToClientMessage =
  | {
      type: "room:init"
      room: RoomSnapshot
      playerId: string
    }
  | {
      type: "room:update"
      room: RoomSnapshot
    }
  | {
      type: "error"
      message: string
    }
  | {
      type: "pong"
    }
