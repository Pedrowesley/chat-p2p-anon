import React from "react";
import { ConnectionState } from "../types/chat";

interface ConnectionStatusProps {
  state: ConnectionState;
  roomId?: string;
  hasEncryption: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  state,
  roomId,
  hasEncryption,
}) => {
  const getStatusInfo = () => {
    switch (state) {
      case "connected":
        return {
          icon: "🟢",
          text: "Conectado",
          className: "border-emerald-500 bg-emerald-500/10",
        };
      case "connecting":
        return {
          icon: "🟡",
          text: "Conectando...",
          className: "border-amber-500 bg-amber-500/10",
        };
      case "failed":
        return {
          icon: "🔴",
          text: "Conexão falhou",
          className: "border-red-500 bg-red-500/10",
        };
      default:
        return {
          icon: "⚪",
          text: "Desconectado",
          className: "border-slate-600 bg-slate-800",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`mt-4 rounded-xl border px-4 py-3 ${statusInfo.className}`}>
      <div className="flex items-center gap-2 justify-center text-slate-100">
        <span className="text-lg">{statusInfo.icon}</span>
        <span className="font-bold">{statusInfo.text}</span>
      </div>

      {roomId && (
        <div className="mt-2 flex justify-center">
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-200 font-mono">
            Sala: {roomId}
          </span>
        </div>
      )}

      {state === "connected" && (
        <div className="mt-2 flex gap-2 justify-center">
          <span
            className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 text-xs font-semibold"
            title="Conexão P2P ativa"
          >
            🌐 P2P
          </span>
          {hasEncryption && (
            <span
              className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 text-xs font-semibold"
              title="Criptografia ativa"
            >
              🔐 Criptografado
            </span>
          )}
        </div>
      )}
    </div>
  );
};
