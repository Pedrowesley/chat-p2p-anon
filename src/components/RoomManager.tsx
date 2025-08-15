import React, { useState } from "react";

interface RoomManagerProps {
  onCreateRoom: () => Promise<string>;
  onJoinRoom: (roomId: string) => Promise<boolean>;
  isLoading: boolean;
}

export const RoomManager: React.FC<RoomManagerProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading,
}) => {
  const [roomId, setRoomId] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    try {
      setError(null);
      const newRoomId = await onCreateRoom();
      setCreatedRoomId(newRoomId);
    } catch (err) {
      setError("Erro ao criar sala. Tente novamente.");
      console.error("Erro ao criar sala:", err);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError("Digite um ID de sala válido");
      return;
    }

    try {
      setError(null);
      await onJoinRoom(roomId.trim().toUpperCase());
    } catch (err) {
      setError("Erro ao entrar na sala. Verifique o ID e tente novamente.");
      console.error("Erro ao entrar na sala:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Erro ao copiar para clipboard:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
        <div className="text-center text-slate-200">
          <div className="w-10 h-10 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p>Preparando sala...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center p-6 bg-slate-900">
      {createdRoomId ? (
        <div className="max-w-2xl w-full mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-200">
          <h2 className="text-green-400 font-bold text-xl mb-6">
            🎉 Sala criada com sucesso!
          </h2>
          <div className="my-6">
            <label className="block mb-2 font-semibold">ID da Sala:</label>
            <div className="flex items-center gap-3">
              <code className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 font-mono text-lg tracking-widest">
                {createdRoomId}
              </code>
              <button
                onClick={() => copyToClipboard(createdRoomId)}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition"
                title="Copiar ID da sala"
              >
                📋
              </button>
            </div>
          </div>
          <div className="text-slate-400">
            <p className="m-0">✅ Compartilhe este ID com seu colega</p>
            <p className="m-0">⏳ Aguardando conexão...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl w-full mx-auto grid gap-6">
          <div className="text-center bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-slate-100 text-xl font-bold mb-2">
              🆕 Criar Nova Sala
            </h2>
            <p className="text-slate-400 mb-4">
              Crie uma sala segura e compartilhe o ID com seu colega
            </p>
            <button
              onClick={handleCreateRoom}
              className="px-5 py-3 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-500 transition"
              disabled={isLoading}
            >
              🚀 Criar Sala
            </button>
          </div>

          <div className="text-center text-slate-400">ou</div>

          <div className="text-center bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-slate-100 text-xl font-bold mb-2">
              🚪 Entrar em Sala
            </h2>
            <p className="text-slate-400 mb-4">
              Digite o ID da sala que você recebeu
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <input
                type="text"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Digite o ID da sala (ex: ABC123XY)"
                className="px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-800 text-slate-100 font-mono tracking-widest uppercase focus:outline-none focus:border-blue-500"
                maxLength={8}
                disabled={isLoading}
              />
              <button
                onClick={handleJoinRoom}
                className="px-5 py-3 rounded-full bg-blue-600 text-white font-semibold shadow disabled:opacity-50 hover:bg-blue-500 transition"
                disabled={!roomId.trim() || isLoading}
              >
                ➡️ Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-2xl w-full mx-auto mt-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-center">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
