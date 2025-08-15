# 🔒 Chat P2P Anônimo

Um sistema de chat peer-to-peer seguro e anônimo com criptografia end-to-end, construído com React, TypeScript e WebRTC.

## ✨ Características

- 🌐 **Comunicação P2P direta** via WebRTC
- 🔐 **Criptografia AES-256** end-to-end
- 🚫 **Zero armazenamento** de mensagens no servidor
- 👥 **Salas temporárias** para 2 pessoas
- 🔑 **Chaves geradas localmente** no navegador
- 📱 **Interface responsiva** e moderna
- 🚀 **Fácil de hospedar** em qualquer lugar

## 🚀 Como usar

### Desenvolvimento Local

1. **Clone e instale dependências:**

```bash
git clone <repo-url>
cd chat-p2p-anonimo
npm run install:all
```

2. **Execute o projeto completo:**

```bash
npm run dev:all
```

Isso irá iniciar:

- Servidor de sinalização na porta 3001
- Interface React na porta 5173

3. **Acesse o chat:**

- Abra http://localhost:5173 em duas abas/navegadores diferentes
- Uma pessoa cria a sala, outra entra com o ID

### Comandos disponíveis

```bash
# Desenvolvimento
npm run dev              # Apenas cliente React
npm run dev:server       # Apenas servidor de sinalização
npm run dev:all          # Cliente + servidor simultaneamente

# Instalação
npm run install:all      # Instala deps do cliente e servidor

# Produção
npm run build           # Build do cliente
npm run start:server   # Servidor em produção
```

## 🔧 Arquitetura

### Frontend (React + TypeScript)

- **Componentes modulares** para chat, conexão e salas
- **Hooks customizados** para WebRTC e criptografia
- **Interface responsiva** com CSS moderno
- **TypeScript** para type safety

### Backend (Node.js + Socket.io)

- **Servidor de sinalização minimalista**
- **Gerenciamento de salas** temporárias
- **Retransmissão de ofertas/respostas** WebRTC
- **Limpeza automática** de salas vazias

### Segurança

- **Criptografia AES-256** implementada com crypto-js
- **Chaves geradas localmente** em cada sessão
- **Comunicação P2P direta** após estabelecida
- **Nenhum dado persistido** no servidor

## 📁 Estrutura do Projeto

```
chat-p2p-anonimo/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ChatApp.tsx     # Componente principal
│   │   ├── ConnectionStatus.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageList.tsx
│   │   ├── RoomManager.tsx
│   │   └── ChatApp.css     # Estilos
│   ├── hooks/              # Hooks customizados
│   │   ├── useWebRTC.ts    # Lógica WebRTC + sinalização
│   │   └── useCrypto.ts    # Criptografia
│   ├── types/              # Tipos TypeScript
│   │   └── chat.ts
│   └── App.tsx
├── server/                 # Servidor de sinalização
│   ├── server.js          # Servidor Socket.io
│   └── package.json
├── package.json
└── README.md
```

## 🌐 Deploy e Hospedagem

### Opções de hospedagem gratuita

1. **Vercel (Frontend) + Railway (Backend)**

   - Frontend: Deploy automático via Git no Vercel
   - Backend: Deploy do servidor no Railway

2. **Netlify (Frontend) + Render (Backend)**

   - Frontend: Build estático no Netlify
   - Backend: Servidor Node.js no Render

3. **Heroku (Fullstack)**
   - Uma única aplicação com frontend e backend

### Configuração para produção

1. **Atualize a URL do servidor no código:**

```typescript
// src/hooks/useWebRTC.ts linha ~32
socketRef.current = io('https://seu-servidor.herokuapp.com', {
```

2. **Configure variáveis de ambiente:**

```bash
PORT=3001
NODE_ENV=production
```

3. **Build e deploy:**

```bash
npm run build
# Deploy pasta dist/ para hospedagem estática
# Deploy pasta server/ para hospedagem Node.js
```

## 🔒 Como funciona a segurança

1. **Estabelecimento da conexão:**

   - Cliente A cria sala e gera chaves de criptografia
   - Cliente B entra na sala usando o ID
   - Servidor de sinalização facilita a conexão WebRTC

2. **Troca de chaves:**

   - Chaves são compartilhadas via canal WebRTC seguro
   - Servidor nunca tem acesso às chaves

3. **Comunicação:**

   - Mensagens são criptografadas localmente antes do envio
   - Transmissão direta P2P via WebRTC
   - Descriptografia local no destinatário

4. **Limpeza:**
   - Chaves existem apenas na sessão do navegador
   - Salas são removidas quando vazias
   - Nenhum histórico é mantido

## 🛠️ Personalização

### Adicionar novos recursos

- **Compartilhamento de arquivos:** Extend DataChannel para binary data
- **Audio/Vídeo:** Adicionar MediaStream ao WebRTC
- **Salas maiores:** Modificar lógica para mais de 2 pessoas
- **Persistência:** Adicionar localStorage opcional para histórico

### Modificar criptografia

- **Algoritmo:** Trocar AES por outro em `useCrypto.ts`
- **Força da chave:** Modificar tamanho da chave gerada
- **Troca de chaves:** Implementar Diffie-Hellman key exchange

## 🐛 Troubleshooting

### Problemas comuns

1. **Conexão WebRTC falha:**

   - Verifique firewall e NAT
   - Teste em rede local primeiro
   - Configure TURN servers para produção

2. **Servidor de sinalização não conecta:**

   - Verifique se está rodando na porta correta
   - Confirme configuração CORS
   - Teste endpoint /health

3. **Mensagens não são criptografadas:**
   - Verifique se as chaves foram compartilhadas
   - Confirme que ambos os clientes suportam crypto-js

### Logs úteis

- **Console do navegador:** Logs de WebRTC e conexão
- **Servidor:** Logs de salas e sinalização
- **Network tab:** Verificar comunicação WebSocket

## 📝 Licença

MIT License - veja arquivo LICENSE para detalhes.

## 🤝 Contribuição

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro para discutir.

---

**Importante:** Este é um projeto educacional/experimental. Para uso em produção, considere implementar autenticação adicional, rate limiting e monitoramento de segurança.
