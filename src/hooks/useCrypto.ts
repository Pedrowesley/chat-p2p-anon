import CryptoJS from "crypto-js";
import { useCallback, useMemo } from "react";
import type { EncryptionKeys } from "../types/chat";

export const useCrypto = () => {
  // Gera chaves de criptografia aleatórias
  const generateKeys = useCallback((): EncryptionKeys => {
    const key = CryptoJS.lib.WordArray.random(256 / 8).toString();
    const iv = CryptoJS.lib.WordArray.random(128 / 8).toString();
    return { key, iv };
  }, []);

  // Criptografa uma mensagem
  const encrypt = useCallback(
    (message: string, keys: EncryptionKeys): string => {
      try {
        const encrypted = CryptoJS.AES.encrypt(message, keys.key, {
          iv: CryptoJS.enc.Hex.parse(keys.iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        return encrypted.toString();
      } catch (error) {
        console.error("Erro ao criptografar mensagem:", error);
        return message; // Fallback para mensagem não criptografada
      }
    },
    []
  );

  // Descriptografa uma mensagem
  const decrypt = useCallback(
    (encryptedMessage: string, keys: EncryptionKeys): string => {
      try {
        const decrypted = CryptoJS.AES.decrypt(encryptedMessage, keys.key, {
          iv: CryptoJS.enc.Hex.parse(keys.iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
      } catch (error) {
        console.error("Erro ao descriptografar mensagem:", error);
        return "[Mensagem não pode ser descriptografada]";
      }
    },
    []
  );

  // Converte chaves para formato de compartilhamento
  const keysToString = useCallback((keys: EncryptionKeys): string => {
    return btoa(JSON.stringify(keys));
  }, []);

  // Converte string de volta para chaves
  const stringToKeys = useCallback(
    (keyString: string): EncryptionKeys | null => {
      try {
        return JSON.parse(atob(keyString));
      } catch (error) {
        console.error("Erro ao converter string para chaves:", error);
        return null;
      }
    },
    []
  );

  return useMemo(
    () => ({
      generateKeys,
      encrypt,
      decrypt,
      keysToString,
      stringToKeys,
    }),
    [generateKeys, encrypt, decrypt, keysToString, stringToKeys]
  );
};
