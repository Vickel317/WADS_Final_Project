import { createServer } from "http";
import { Server } from "socket.io";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const corsOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  "http://localhost:3000",
].filter((origin): origin is string => Boolean(origin));

const SOCKET_EMIT_SECRET = process.env.SOCKET_EMIT_SECRET;

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  // POST /emit-notification — allow Next.js API routes to push real-time notifications
  if (req.url === "/emit-notification" && req.method === "POST") {
    const providedSecret = req.headers["x-socket-emit-secret"];
    if (!SOCKET_EMIT_SECRET || providedSecret !== SOCKET_EMIT_SECRET) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const { userId, notification } = JSON.parse(body) as {
          userId: string;
          notification: NotificationEvent;
        };
        if (userId && notification) {
          emitToUser(userId, "new_notification", notification);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// userId → Set of socketIds (supports multiple tabs per user)
const userSockets = new Map<string, Set<string>>();

function registerUser(socketId: string, userId: string) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socketId);
}

function unregisterSocket(socketId: string) {
  for (const [userId, sockets] of userSockets.entries()) {
    if (sockets.has(socketId)) {
      sockets.delete(socketId);
      if (sockets.size === 0) userSockets.delete(userId);
      break;
    }
  }
}

function emitToUser(targetUserId: string, event: string, data: unknown) {
  const sockets = userSockets.get(targetUserId);
  if (sockets) {
    for (const sid of sockets) {
      io.to(sid).emit(event, data);
    }
  }
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface SpaceChatMessage {
  id: string;
  senderId: string;
  spaceId: string;
  content: string;
  createdAt: string;
}

export interface NotificationEvent {
  notificationID: string;
  content: string;
  link: string | null;
  createdAt: string;
}

function getSpaceRoom(spaceId: string) {
  return `space:${spaceId}`;
}

io.on("connection", (socket) => {
  let myUserId: string | null = null;

  socket.on("authenticate", (userId: string) => {
    if (typeof userId !== "string" || !userId) return;
    myUserId = userId;
    registerUser(socket.id, userId);
    socket.emit("authenticated");
  });

  // Relay a fully-saved message to the recipient
  socket.on("send_message", (msg: ChatMessage) => {
    if (!myUserId || msg.senderId !== myUserId) return;
    emitToUser(msg.receiverId, "new_message", msg);
  });

  socket.on("join_space", ({ spaceId }: { spaceId: string }) => {
    if (!myUserId || !spaceId) return;
    socket.join(getSpaceRoom(spaceId));
  });

  socket.on("leave_space", ({ spaceId }: { spaceId: string }) => {
    if (!spaceId) return;
    socket.leave(getSpaceRoom(spaceId));
  });

  socket.on("send_space_message", (msg: SpaceChatMessage) => {
    if (!myUserId || msg.senderId !== myUserId || !msg.spaceId) return;
    io.to(getSpaceRoom(msg.spaceId)).emit("new_space_message", msg);
  });

  socket.on("typing", ({ to }: { to: string }) => {
    if (!myUserId) return;
    emitToUser(to, "typing", { from: myUserId });
  });

  socket.on("stop_typing", ({ to }: { to: string }) => {
    if (!myUserId) return;
    emitToUser(to, "stop_typing", { from: myUserId });
  });

  socket.on("check_online", (userId: string, callback: (online: boolean) => void) => {
    if (typeof callback === "function") {
      callback(userSockets.has(userId));
    }
  });

  socket.on("disconnect", () => {
    unregisterSocket(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[socket] Server running on port ${PORT}`);
});
