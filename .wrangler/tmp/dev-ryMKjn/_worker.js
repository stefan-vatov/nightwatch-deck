var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/_worker.ts
var ROOM_HEADER = "x-nightwatch-room-id";
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/ws/")) {
      if (request.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return new Response("Expected WebSocket Upgrade", { status: 426 });
      }
      const roomId = url.pathname.replace(/^\/ws\//, "").split("/")[0]?.trim();
      if (!roomId) {
        return new Response("Room id required", { status: 400 });
      }
      const normalizedRoomId = roomId.toUpperCase();
      const stub = env.ROOM_STATE.get(env.ROOM_STATE.idFromName(normalizedRoomId));
      const headers = new Headers(request.headers);
      headers.set(ROOM_HEADER, normalizedRoomId);
      const forwarded = new Request(request, { headers });
      return stub.fetch(forwarded);
    }
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  }
};
var RoomDurableObject = class {
  static {
    __name(this, "RoomDurableObject");
  }
  state;
  roomId;
  participants = /* @__PURE__ */ new Map();
  ownerId = null;
  revealed = false;
  round = 1;
  connections = /* @__PURE__ */ new Map();
  socketsByPlayerId = /* @__PURE__ */ new Map();
  constructor(state) {
    this.state = state;
    this.roomId = state.id.toString();
  }
  async fetch(request) {
    this.roomId = request.headers.get(ROOM_HEADER) ?? this.roomId;
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket Upgrade", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.handleConnection(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  handleConnection(socket) {
    socket.accept();
    this.connections.set(socket, {});
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      this.handleIncomingMessage(socket, event.data);
    });
    const cleanup = /* @__PURE__ */ __name(() => this.handleDisconnect(socket), "cleanup");
    socket.addEventListener("close", cleanup);
    socket.addEventListener("error", cleanup);
  }
  handleIncomingMessage(socket, raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.sendError(socket, "Invalid payload");
      return;
    }
    switch (parsed.type) {
      case "join":
        this.handleJoin(socket, parsed);
        break;
      case "vote":
        this.handleVote(socket, parsed);
        break;
      case "reveal":
        this.handleReveal(socket, parsed.playerId);
        break;
      case "reset":
        this.handleReset(socket, parsed.playerId);
        break;
      case "leave":
        this.handleLeave(socket, parsed.playerId);
        break;
      case "ping":
        socket.send(JSON.stringify({ type: "pong" }));
        break;
      default:
        this.sendError(socket, "Unsupported message type");
    }
  }
  handleJoin(socket, payload) {
    const name = payload.name?.trim();
    if (!name) {
      this.sendError(socket, "Name is required");
      return;
    }
    const playerId = payload.playerId;
    const existingSocket = this.socketsByPlayerId.get(playerId);
    if (existingSocket && existingSocket !== socket) {
      existingSocket.close(1e3, "Replaced by a new session");
    }
    const participant = this.participants.get(playerId) ?? {
      id: playerId,
      name,
      estimate: null,
      joinedAt: Date.now()
    };
    participant.name = name.slice(0, 80);
    this.participants.set(playerId, participant);
    const metadata = this.connections.get(socket);
    if (metadata) {
      metadata.playerId = playerId;
    }
    this.socketsByPlayerId.set(playerId, socket);
    if (!this.ownerId || !this.participants.has(this.ownerId)) {
      this.ownerId = playerId;
    }
    const snapshot = this.serializeRoom();
    socket.send(JSON.stringify({ type: "room:init", room: snapshot, playerId }));
    this.broadcastState(socket);
  }
  handleVote(socket, payload) {
    if (!this.ensureParticipant(payload.playerId, socket)) {
      return;
    }
    const participant = this.participants.get(payload.playerId);
    participant.estimate = payload.value;
    this.broadcastState();
  }
  handleReveal(socket, playerId) {
    if (!this.assertOwner(socket, playerId)) return;
    this.revealed = true;
    this.broadcastState();
  }
  handleReset(socket, playerId) {
    if (!this.assertOwner(socket, playerId)) return;
    this.revealed = false;
    this.round += 1;
    this.participants.forEach((participant) => {
      participant.estimate = null;
    });
    this.broadcastState();
  }
  handleLeave(socket, playerId) {
    this.removeParticipant(playerId);
    socket.close(1e3, "Left room");
  }
  handleDisconnect(socket) {
    const metadata = this.connections.get(socket);
    this.connections.delete(socket);
    if (!metadata?.playerId) {
      return;
    }
    if (this.socketsByPlayerId.get(metadata.playerId) === socket) {
      this.socketsByPlayerId.delete(metadata.playerId);
      this.removeParticipant(metadata.playerId);
    }
  }
  ensureParticipant(playerId, socket) {
    if (!this.participants.has(playerId)) {
      this.sendError(socket, "Unknown participant");
      return false;
    }
    return true;
  }
  assertOwner(socket, playerId) {
    if (!this.ensureParticipant(playerId, socket)) {
      return false;
    }
    if (this.ownerId !== playerId) {
      this.sendError(socket, "Only the room owner can perform that action");
      return false;
    }
    return true;
  }
  removeParticipant(playerId) {
    const existed = this.participants.delete(playerId);
    if (!existed) return;
    const existingSocket = this.socketsByPlayerId.get(playerId);
    if (existingSocket) {
      this.socketsByPlayerId.delete(playerId);
      const meta = this.connections.get(existingSocket);
      if (meta && meta.playerId === playerId) {
        meta.playerId = void 0;
      }
    }
    if (this.ownerId === playerId) {
      this.ownerId = this.pickNextOwner();
    }
    if (this.participants.size === 0) {
      this.ownerId = null;
      this.revealed = false;
      this.round = 1;
    }
    this.broadcastState();
  }
  pickNextOwner() {
    const [next] = [...this.participants.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    return next?.id ?? null;
  }
  serializeRoom() {
    const players = [...this.participants.values()].sort((a, b) => a.joinedAt - b.joinedAt).map((participant) => ({
      id: participant.id,
      name: participant.name,
      estimate: participant.estimate,
      isOwner: participant.id === this.ownerId
    }));
    return {
      id: this.roomId,
      players,
      revealed: this.revealed,
      round: this.round
    };
  }
  broadcastState(skipSocket) {
    if (this.connections.size === 0) return;
    const payload = {
      type: "room:update",
      room: this.serializeRoom()
    };
    const message = JSON.stringify(payload);
    for (const socket of this.connections.keys()) {
      if (socket === skipSocket) continue;
      try {
        socket.send(message);
      } catch {
        this.handleDisconnect(socket);
      }
    }
  }
  sendError(socket, message) {
    const payload = {
      type: "error",
      message
    };
    try {
      socket.send(JSON.stringify(payload));
    } catch {
      socket.close(1011, "Unable to deliver error");
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-dnmI3I/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-dnmI3I/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  RoomDurableObject,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=_worker.js.map
