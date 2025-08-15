import React, { useEffect, useRef, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
// Tailwind no lugar do CSS local
import { ConnectionStatus } from "./ConnectionStatus";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { RoomManager } from "./RoomManager";

export const ChatApp: React.FC = () => {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(
    null as unknown as HTMLDivElement
  );

  const {
    connectionState,
    messages,
    roomInfo,
    createRoom,
    joinRoom,
    sendMessage,
    disconnect,
  } = useWebRTC();

  const handleSendMessage = () => {
    if (messageText.trim() && connectionState === "connected") {
      const success = sendMessage(messageText.trim());
      if (success) {
        setMessageText("");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen flex flex-col bg-slate-900">
      <header className="bg-slate-900 text-slate-100 px-6 pt-10 pb-6 shadow-sm">
        <h1 className="m-0 text-3xl sm:text-4xl font-extrabold tracking-tight">
          🔒 Chat P2P Anônimo
        </h1>
        <p className="m-0 text-slate-300 mt-2">
          Comunicação segura e criptografada
        </p>
        <ConnectionStatus
          state={connectionState}
          roomId={roomInfo?.id}
          hasEncryption={false}
        />
      </header>

      {!roomInfo ? (
        <RoomManager
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          isLoading={connectionState === "connecting"}
        />
      ) : (
        <div className="flex-1 flex flex-col bg-slate-900">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 text-slate-200">
              <span className="font-semibold">Sala:</span>
              <code className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono tracking-widest text-slate-100">
                {roomInfo.id}
              </code>
              {roomInfo.isCreator && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  Criador
                </span>
              )}
            </div>

            {connectionState === "connecting" && (
              <div className="text-right text-slate-400">
                <p className="m-0">⏳ Aguardando conexão...</p>
                <p className="m-0 text-sm">
                  Compartilhe o ID <strong>{roomInfo.id}</strong> com seu colega
                </p>
              </div>
            )}

            {/* AES removido: botão de compartilhar chaves desativado */}
          </div>

          <MessageList messages={messages} messagesEndRef={messagesEndRef} />

          <MessageInput
            value={messageText}
            onChange={setMessageText}
            onSend={handleSendMessage}
            onKeyPress={handleKeyPress}
            disabled={connectionState !== "connected"}
            hasEncryption={false}
          />

          <div className="px-6 py-4 border-t border-slate-700 text-center">
            <button
              onClick={disconnect}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/20 transition"
            >
              🚪 Sair da Sala
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 px-6 pb-10">
        <details>
          <summary className="cursor-pointer text-slate-100 font-semibold">
            Como funciona este chat?
          </summary>
          <ul>
            <li>
              ✅ <strong>Conexão P2P:</strong> Comunicação direta entre
              navegadores via WebRTC
            </li>
            <li>
              🔒 <strong>Transporte criptografado (DTLS):</strong> Ponta-a-ponta
            </li>
            <li>
              🚫 <strong>Zero armazenamento:</strong> Nenhuma mensagem fica
              salva em servidores
            </li>
            <li>
              👥 <strong>Apenas vocês dois:</strong> Só você e seu colega têm
              acesso às mensagens
            </li>
            <li>
              🔐 <strong>Chaves locais:</strong> Criptografia gerada no seu
              navegador
            </li>
            <li>
              🌐 <strong>Anônimo:</strong> Não é necessário cadastro ou
              identificação
            </li>
          </ul>
        </details>

        <details>
          <summary className="cursor-pointer text-slate-100 font-semibold">
            Instruções de uso
          </summary>
          <ol>
            <li>
              <strong>Criar sala:</strong> Clique em "Criar Nova Sala" e
              compartilhe o ID gerado
            </li>
            <li>
              <strong>Entrar na sala:</strong> Digite o ID da sala e clique em
              "Entrar"
            </li>
            <li>
              <strong>Ativar criptografia:</strong> O criador da sala pode
              ativar a criptografia
            </li>
            <li>
              <strong>Conversar:</strong> Digite suas mensagens e pressione
              Enter
            </li>
          </ol>
        </details>
      </div>
    </div>
  );
};
