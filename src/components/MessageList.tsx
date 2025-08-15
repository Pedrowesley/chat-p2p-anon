import React from "react";
import { ChatMessage } from "../types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  messagesEndRef,
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
          <div className="text-5xl mb-3 opacity-60">💬</div>
          <p className="m-0">Nenhuma mensagem ainda</p>
          <p className="m-0 text-sm opacity-80">
            Comece a conversa digitando uma mensagem abaixo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex max-w-[70%] ${
              message.sender === "local" ? "self-end" : "self-start"
            }`}
          >
            <div
              className={`px-4 py-3 shadow-sm ${
                message.sender === "local"
                  ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                  : "bg-slate-800 text-slate-100 border border-slate-700 rounded-2xl rounded-bl-md"
              }`}
            >
              <span className="block leading-relaxed break-words text-base">
                {message.text}
              </span>
              <div className="flex items-center justify-between gap-4 mt-1.5">
                <span
                  className={`text-xs ${
                    message.sender === "local"
                      ? "text-white/80"
                      : "text-slate-400"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
