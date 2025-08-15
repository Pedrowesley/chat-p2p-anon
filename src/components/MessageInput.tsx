import React from "react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  hasEncryption: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled,
  hasEncryption,
}) => {
  return (
    <div className="px-6 pb-6 pt-4 bg-slate-900 border-t border-slate-700">
      <div className="flex gap-3 items-end mb-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={
            disabled ? "Aguardando conexão..." : "Digite sua mensagem..."
          }
          className="flex-1 p-3 rounded-2xl border-2 border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 resize-none"
          disabled={disabled}
          rows={1}
          style={{ minHeight: "40px", maxHeight: "120px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="w-12 h-12 rounded-full bg-blue-600 text-white text-xl grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition"
          title="Enviar mensagem (Enter)"
        >
          📤
        </button>
      </div>

      <div className="flex items-center justify-between text-slate-400 text-sm">
        <div>
          💡 Pressione{" "}
          <kbd className="px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800">
            Enter
          </kbd>{" "}
          para enviar
        </div>
        {hasEncryption && (
          <div>
            <span className="text-green-400 font-semibold">
              🔐 Criptografia ativa
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
