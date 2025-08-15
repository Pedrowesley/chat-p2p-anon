import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  ChatMessage,
  ConnectionState,
  PeerConnection,
  RoomInfo,
} from "../types/chat";
// Camada AES removida: não usamos mais useCrypto

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const useWebRTC = () => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  // AES removido: não armazenamos chaves de aplicação

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<PeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Refs para evitar closures desatualizadas
  const roomInfoRef = useRef<RoomInfo | null>(null);
  const initiateWebRTCConnectionRef = useRef<
    (() => void | Promise<void>) | null
  >(null);
  const handleWebRTCOfferRef = useRef<
    | ((
        offer: RTCSessionDescriptionInit,
        fromPeerId: string
      ) => void | Promise<void>)
    | null
  >(null);
  const handleWebRTCAnswerRef = useRef<
    ((answer: RTCSessionDescriptionInit) => void | Promise<void>) | null
  >(null);
  const handleICECandidateRef = useRef<
    ((candidate: RTCIceCandidateInit) => void | Promise<void>) | null
  >(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    roomInfoRef.current = roomInfo;
  }, [roomInfo]);

  // Camada AES removida: não usamos encrypt/decrypt

  // Gera ID único para o peer
  const generatePeerId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  // Conecta ao servidor de sinalização
  const connectToSignalingServer = useCallback(() => {
    if (socketRef.current?.connected) return;

    const SIGNALING_URL =
      import.meta.env.VITE_SIGNALING_SERVER ?? "http://localhost:3001";

    socketRef.current = io(SIGNALING_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Conectado ao servidor de sinalização");
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Desconectado do servidor de sinalização");
    });

    socketRef.current.on("room-joined", ({ roomId, peerId, isInitiator }) => {
      console.log(
        `✅ Entrou na sala ${roomId} como ${
          isInitiator ? "iniciador" : "participante"
        }`
      );
      setRoomInfo((prev) =>
        prev
          ? { ...prev, peerId }
          : { id: roomId, isCreator: !!isInitiator, peerId }
      );

      if (isInitiator) {
        // Se for o iniciador, espera o outro peer
        console.log("⏳ Aguardando outro peer...");
      }
    });

    socketRef.current.on("peer-joined", ({ peerId }) => {
      console.log(`👋 Peer ${peerId} entrou na sala`);
      // Inicia a conexão WebRTC se for o primeiro peer na sala
      setTimeout(() => {
        console.log("🔍 RoomInfo no momento da chamada:", roomInfoRef.current);
        if (initiateWebRTCConnectionRef.current) {
          initiateWebRTCConnectionRef.current();
        }
      }, 100); // Pequeno delay para garantir que a conexão está pronta
    });

    socketRef.current.on("room-full", ({ roomId }) => {
      console.log(`❌ Sala ${roomId} está cheia`);
      setConnectionState("failed");
    });

    socketRef.current.on("webrtc-offer", async ({ fromPeerId, offer }) => {
      console.log(`📥 Recebeu oferta de ${fromPeerId}`);
      // Se a PeerConnection ainda não estiver pronta, adia o processamento
      if (!peerConnectionRef.current?.connection) {
        console.warn(
          "⏳ PeerConnection ainda não está pronta. Adiando oferta..."
        );
        pendingOfferRef.current = offer;
        setTimeout(async () => {
          if (
            pendingOfferRef.current &&
            peerConnectionRef.current?.connection
          ) {
            const deferredOffer = pendingOfferRef.current;
            pendingOfferRef.current = null;
            if (handleWebRTCOfferRef.current) {
              await handleWebRTCOfferRef.current(deferredOffer, fromPeerId);
            }
          }
        }, 150);
        return;
      }
      if (handleWebRTCOfferRef.current) {
        await handleWebRTCOfferRef.current(offer, fromPeerId);
      }
    });

    socketRef.current.on("webrtc-answer", async ({ fromPeerId, answer }) => {
      console.log(`📥 Recebeu resposta de ${fromPeerId}`);
      if (handleWebRTCAnswerRef.current) {
        await handleWebRTCAnswerRef.current(answer);
      }
    });

    socketRef.current.on("ice-candidate", ({ fromPeerId, candidate }) => {
      console.log(`🧊 Recebeu ICE candidate de ${fromPeerId}`);
      if (handleICECandidateRef.current) {
        handleICECandidateRef.current(candidate);
      }
    });

    socketRef.current.on("peer-left", ({ peerId }) => {
      console.log(`👋 Peer ${peerId} saiu da sala`);
      setConnectionState("disconnected");
    });

    return socketRef.current;
  }, []);

  // (moved) Mantém refs atualizadas com as versões mais recentes dos handlers

  // Inicializa conexão WebRTC
  const initializePeerConnection = useCallback(async () => {
    try {
      const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      peerConnection.onicecandidate = (event) => {
        const currentRoom = roomInfoRef.current;
        if (event.candidate && socketRef.current && currentRoom) {
          socketRef.current.emit("ice-candidate", {
            roomId: currentRoom.id,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log("Estado da conexão P2P:", state);

        if (state === "connected") {
          setConnectionState("connected");
        } else if (state === "failed" || state === "disconnected") {
          setConnectionState("failed");
        }
      };

      peerConnection.ondatachannel = (event) => {
        const channel = event.channel;
        setupDataChannel(channel);
      };

      peerConnectionRef.current = {
        id: generatePeerId(),
        connection: peerConnection,
        dataChannel: null,
        isConnected: false,
      };

      // Se houve uma oferta pendente antes da PeerConnection estar pronta, processa agora
      if (pendingOfferRef.current && handleWebRTCOfferRef.current) {
        const deferredOffer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        // Processa de forma assíncrona
        setTimeout(() => {
          if (handleWebRTCOfferRef.current) {
            handleWebRTCOfferRef.current(deferredOffer, "unknown");
          }
        }, 0);
      }

      return peerConnection;
    } catch (error) {
      console.error("Erro ao inicializar conexão WebRTC:", error);
      setConnectionState("failed");
      return null;
    }
  }, [roomInfo, generatePeerId]);

  // Configura data channel
  const setupDataChannel = useCallback(
    (channel: RTCDataChannel) => {
      channel.onopen = () => {
        console.log("🔌 Data channel aberto - conexão estabelecida!");
        setConnectionState("connected");
        if (peerConnectionRef.current) {
          peerConnectionRef.current.isConnected = true;
        }
      };

      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "message") {
            const messageText = data.text;

            const newMessage: ChatMessage = {
              id: data.id || Date.now().toString(),
              text: messageText,
              timestamp: data.timestamp || Date.now(),
              sender: "remote",
              encrypted: false,
            };

            setMessages((prev) => [...prev, newMessage]);
          }
        } catch (error) {
          console.error("Erro ao processar mensagem:", error);
        }
      };

      channel.onclose = () => {
        console.log("Data channel fechado");
        setConnectionState("disconnected");
        if (peerConnectionRef.current) {
          peerConnectionRef.current.isConnected = false;
        }
      };

      channel.onerror = (error) => {
        console.error("Erro no data channel:", error);
        setConnectionState("failed");
      };

      dataChannelRef.current = channel;
      if (peerConnectionRef.current) {
        peerConnectionRef.current.dataChannel = channel;
      }
    },
    [
      /* no deps */
    ]
  );

  // Inicia conexão WebRTC
  const initiateWebRTCConnection = useCallback(async () => {
    console.log("🚀 Iniciando conexão WebRTC...");
    console.log("🔍 Estados atuais:", {
      peerConnection: !!peerConnectionRef.current?.connection,
      roomInfo: roomInfo,
      socket: !!socketRef.current,
      socketConnected: socketRef.current?.connected,
    });

    if (!peerConnectionRef.current?.connection) {
      console.error("❌ PeerConnection não encontrada");
      return;
    }

    if (!roomInfo) {
      console.error("❌ RoomInfo não disponível, aguardando...");
      // Tenta novamente após um pequeno delay
      setTimeout(() => initiateWebRTCConnection(), 200);
      return;
    }

    const pc = peerConnectionRef.current.connection;

    // Cria data channel
    const channel = pc.createDataChannel("chat", {
      ordered: true,
      negotiated: false,
    });
    setupDataChannel(channel);
    console.log("📡 Data channel criado e configurado");

    // Cria oferta
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("📤 Oferta WebRTC criada e definida localmente");

    // Envia oferta via servidor
    console.log("🔍 Verificando condições para enviar oferta:", {
      socket: !!socketRef.current,
      socketConnected: socketRef.current?.connected,
      roomInfo: !!roomInfo,
      roomId: roomInfo?.id,
    });

    if (socketRef.current && roomInfo) {
      socketRef.current.emit("webrtc-offer", {
        roomId: roomInfo.id,
        targetPeerId: "other", // Simplificado para P2P
        offer: offer,
      });
      console.log("📡 Oferta enviada via servidor de sinalização");
    } else {
      console.error("❌ Não foi possível enviar oferta:", {
        socket: !!socketRef.current,
        roomInfo: !!roomInfo,
      });
    }
  }, [roomInfo, setupDataChannel]); // Readicionando roomInfo às dependências

  // Trata oferta WebRTC recebida
  const handleWebRTCOffer = useCallback(
    async (offer: RTCSessionDescriptionInit, fromPeerId: string) => {
      console.log("📥 Processando oferta WebRTC recebida...");
      if (!peerConnectionRef.current?.connection) {
        console.error("❌ PeerConnection não encontrada para processar oferta");
        return;
      }

      const pc = peerConnectionRef.current.connection;

      await pc.setRemoteDescription(offer);
      console.log("✅ Descrição remota definida");

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("📤 Resposta WebRTC criada e definida localmente");

      // Envia resposta via servidor (usar ref para evitar closure desatualizada)
      const currentRoomInfo = roomInfoRef.current;
      if (socketRef.current && currentRoomInfo) {
        socketRef.current.emit("webrtc-answer", {
          roomId: currentRoomInfo.id,
          targetPeerId: fromPeerId,
          answer: answer,
        });
        console.log("📡 Resposta enviada via servidor de sinalização");
      }

      // Aplica candidatos ICE pendentes agora que a remoteDescription existe
      if (pendingCandidatesRef.current.length > 0) {
        console.log(
          `📦 Aplicando ${pendingCandidatesRef.current.length} ICE candidates pendentes`
        );
        for (const queued of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(queued);
          } catch (err) {
            console.error("❌ Falha ao aplicar ICE candidate pendente:", err);
          }
        }
        pendingCandidatesRef.current = [];
      }
    },
    []
  );

  // Trata resposta WebRTC recebida
  const handleWebRTCAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      console.log("📥 Processando resposta WebRTC recebida...");
      if (!peerConnectionRef.current?.connection) {
        console.error(
          "❌ PeerConnection não encontrada para processar resposta"
        );
        return;
      }

      const pc = peerConnectionRef.current.connection;
      await pc.setRemoteDescription(answer);
      console.log("✅ Resposta WebRTC processada com sucesso");

      // Aplica candidatos ICE pendentes agora que a remoteDescription existe (lado offer)
      if (pendingCandidatesRef.current.length > 0) {
        console.log(
          `📦 Aplicando ${pendingCandidatesRef.current.length} ICE candidates pendentes (offer)`
        );
        for (const queued of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(queued);
          } catch (err) {
            console.error(
              "❌ Falha ao aplicar ICE candidate pendente (offer):",
              err
            );
          }
        }
        pendingCandidatesRef.current = [];
      }
    },
    []
  );

  // Trata candidato ICE recebido
  const handleICECandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!peerConnectionRef.current?.connection) return;

      // Fim dos candidatos (alguns navegadores enviam null)
      if (!candidate) {
        return;
      }

      const pc = peerConnectionRef.current.connection;
      // Se a descrição remota ainda não foi aplicada, guarda em fila
      if (!pc.remoteDescription) {
        console.warn(
          "⏳ RemoteDescription ausente. Enfileirando ICE candidate..."
        );
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.error("❌ Falha ao adicionar ICE candidate:", err);
      }
    },
    []
  );

  // Mantém refs atualizadas com as versões mais recentes dos handlers
  useEffect(() => {
    initiateWebRTCConnectionRef.current = initiateWebRTCConnection;
  }, [initiateWebRTCConnection]);
  useEffect(() => {
    handleWebRTCOfferRef.current = handleWebRTCOffer;
  }, [handleWebRTCOffer]);
  useEffect(() => {
    handleWebRTCAnswerRef.current = handleWebRTCAnswer;
  }, [handleWebRTCAnswer]);
  useEffect(() => {
    handleICECandidateRef.current = handleICECandidate;
  }, [handleICECandidate]);

  // Cria sala
  const createRoom = useCallback(async () => {
    const roomId = Math.random().toString(36).substr(2, 8).toUpperCase();
    const peerId = generatePeerId();
    setRoomInfo({ id: roomId, isCreator: true, peerId });
    setConnectionState("connecting");

    await initializePeerConnection();
    const socket = connectToSignalingServer();

    // Aguarda conexão com servidor e então entra na sala
    if (socket) {
      socket.on("connect", () => {
        socket.emit("join-room", { roomId, peerId });
      });
    }

    return roomId;
  }, [generatePeerId, initializePeerConnection, connectToSignalingServer]);

  // Entra em sala
  const joinRoom = useCallback(
    async (roomId: string) => {
      const peerId = generatePeerId();

      setRoomInfo({ id: roomId, isCreator: false, peerId });
      setConnectionState("connecting");

      await initializePeerConnection();
      const socket = connectToSignalingServer();

      // Aguarda conexão com servidor e então entra na sala
      if (socket) {
        socket.on("connect", () => {
          socket.emit("join-room", { roomId, peerId });
        });
      }

      return true;
    },
    [generatePeerId, initializePeerConnection, connectToSignalingServer]
  );

  // Envia mensagem
  const sendMessage = useCallback((text: string) => {
    if (
      !dataChannelRef.current ||
      dataChannelRef.current.readyState !== "open"
    ) {
      console.error("Data channel não está aberto");
      return false;
    }

    try {
      const message = {
        type: "message",
        id: Date.now().toString(),
        text: text,
        timestamp: Date.now(),
        encrypted: false,
      };

      dataChannelRef.current.send(JSON.stringify(message));

      // Adiciona mensagem local
      const localMessage: ChatMessage = {
        id: message.id,
        text: text,
        timestamp: message.timestamp,
        sender: "local",
        encrypted: false,
      };

      setMessages((prev) => [...prev, localMessage]);
      return true;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return false;
    }
  }, []);

  // Compartilha chaves de criptografia
  const shareEncryptionKeys = useCallback(() => {
    // Camada AES removida: não compartilhamos mais chaves
    return;
  }, []);

  // Desconecta
  const disconnect = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current?.connection) {
      peerConnectionRef.current.connection.close();
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionState("disconnected");
    setRoomInfo(null);
    // AES removido: nada para limpar
    setMessages([]);
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    messages,
    roomInfo,
    encryptionKeys: false,
    createRoom,
    joinRoom,
    sendMessage,
    disconnect,
    shareEncryptionKeys,
  };
};
