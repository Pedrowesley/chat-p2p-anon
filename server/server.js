import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

// Configuração CORS (dev + produção)
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// Armazena informações das salas (apenas em memória para simplicidade)
const rooms = new Map();

// Rota de health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    rooms: rooms.size,
    timestamp: new Date().toISOString(),
  });
});

// Gerenciamento das conexões WebSocket
io.on("connection", (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Criar ou entrar em uma sala
  socket.on("join-room", ({ roomId, peerId }) => {
    console.log(`📍 ${peerId} tentando entrar na sala ${roomId}`);

    // Sai de todas as salas anteriores
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Verifica se a sala existe
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    const room = rooms.get(roomId);

    // Limite de 2 pessoas por sala (P2P)
    if (room.size >= 2) {
      socket.emit("room-full", { roomId });
      console.log(`❌ Sala ${roomId} está cheia`);
      return;
    }

    // Adiciona o peer à sala
    room.add(peerId);
    socket.join(roomId);
    socket.peerId = peerId;
    socket.roomId = roomId;

    console.log(`✅ ${peerId} entrou na sala ${roomId} (${room.size}/2)`);

    // Notifica outros peers na sala
    socket.to(roomId).emit("peer-joined", {
      peerId,
      roomId,
      isInitiator: room.size === 1,
    });

    // Confirma entrada na sala
    socket.emit("room-joined", {
      roomId,
      peerId,
      isInitiator: room.size === 1,
      peersCount: room.size,
    });
  });

  // Retransmitir ofertas WebRTC
  socket.on("webrtc-offer", ({ roomId, targetPeerId, offer }) => {
    console.log(
      `📤 Oferta WebRTC de ${socket.peerId} para ${targetPeerId} na sala ${roomId}`
    );

    socket.to(roomId).emit("webrtc-offer", {
      fromPeerId: socket.peerId,
      offer,
    });
  });

  // Retransmitir respostas WebRTC
  socket.on("webrtc-answer", ({ roomId, targetPeerId, answer }) => {
    console.log(
      `📤 Resposta WebRTC de ${socket.peerId} para ${targetPeerId} na sala ${roomId}`
    );

    socket.to(roomId).emit("webrtc-answer", {
      fromPeerId: socket.peerId,
      answer,
    });
  });

  // Retransmitir candidatos ICE
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    console.log(`🧊 ICE candidate de ${socket.peerId} na sala ${roomId}`);

    socket.to(roomId).emit("ice-candidate", {
      fromPeerId: socket.peerId,
      candidate,
    });
  });

  // Sinalizar que peer está pronto
  socket.on("peer-ready", ({ roomId }) => {
    console.log(`✅ ${socket.peerId} está pronto na sala ${roomId}`);
    socket.to(roomId).emit("peer-ready", {
      peerId: socket.peerId,
    });
  });

  // Desconexão
  socket.on("disconnect", () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);

    if (socket.roomId && socket.peerId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.delete(socket.peerId);

        // Remove sala vazia
        if (room.size === 0) {
          rooms.delete(socket.roomId);
          console.log(`🗑️ Sala ${socket.roomId} removida (vazia)`);
        } else {
          // Notifica outros peers que este saiu
          socket.to(socket.roomId).emit("peer-left", {
            peerId: socket.peerId,
          });
          console.log(`👋 ${socket.peerId} saiu da sala ${socket.roomId}`);
        }
      }
    }
  });

  // Listar salas (para debug)
  socket.on("list-rooms", () => {
    const roomList = Array.from(rooms.entries()).map(([id, peers]) => ({
      id,
      peersCount: peers.size,
      peers: Array.from(peers),
    }));

    socket.emit("rooms-list", roomList);
  });
});

// Limpeza periódica de salas vazias
setInterval(() => {
  const emptyRooms = [];
  rooms.forEach((peers, roomId) => {
    if (peers.size === 0) {
      emptyRooms.push(roomId);
    }
  });

  emptyRooms.forEach((roomId) => {
    rooms.delete(roomId);
  });

  if (emptyRooms.length > 0) {
    console.log(`🧹 Limpeza: ${emptyRooms.length} salas vazias removidas`);
  }
}, 30000); // A cada 30 segundos

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor de sinalização rodando na porta ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
