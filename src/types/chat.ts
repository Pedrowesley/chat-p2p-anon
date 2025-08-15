export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  sender: "local" | "remote";
  encrypted?: boolean;
}

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  isConnected: boolean;
}

export interface RoomInfo {
  id: string;
  isCreator: boolean;
  peerId?: string;
}

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "failed";

export interface EncryptionKeys {
  key: string;
  iv: string;
}

export interface SignalingMessage {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "join-room"
    | "room-joined"
    | "peer-left";
  roomId: string;
  peerId: string;
  data?: RTCSessionDescriptionInit | RTCIceCandidate | unknown;
}
