import { ServerWebSocket } from "bun";

type SessionId = string;

const READY_STATE_OPEN = 1;

export class SessionService {
  static instance: SessionService;

  private sessions: Map<SessionId, ServerWebSocket> = new Map();

  static getInstance() {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  append(id: SessionId, ws: ServerWebSocket) {
    this.sessions.set(id, ws);
  }

  remove(id: SessionId) {
    this.sessions.delete(id);
  }

  send(id: SessionId, message: string) {
    const ws = this.sessions.get(id);
    if (ws && ws.readyState === READY_STATE_OPEN) {
      ws.send(message);
    }
  }

  broadcast(message: string) {
    Array.from(this.sessions.values()).forEach((ws) => {
      if (ws.readyState === READY_STATE_OPEN) {
        ws.send(message);
      }
    });
  }

  count() {
    return this.sessions.size;
  }

  getSessionIds() {
    return Array.from(this.sessions.keys());
  }
}
