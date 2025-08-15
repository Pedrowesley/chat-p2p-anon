# Deploy (Frontend + Signaling Server)

Guia rápido para publicar o frontend (Vercel) e o servidor de sinalização (Render) de forma gratuita. O projeto continua funcionando localmente com fallback para `localhost`.

## 1) Pré‑requisitos

- Repositório no GitHub com o código da pasta raiz
- Node 20+ local (já usado no projeto)

## 2) Variáveis de ambiente

- Frontend (Vercel)
  - `VITE_SIGNALING_SERVER=https://SEU-SINAL.onrender.com`
- Servidor (Render)
  - `FRONTEND_ORIGIN=https://SEU-APP.vercel.app`
  - `NODE_ENV=production`

> Substitua os placeholders:
>
> - `https://SEU-SINAL.onrender.com` pela URL gerada na Render
> - `https://SEU-APP.vercel.app` pela URL gerada na Vercel

## 3) Fluxo de Git

```bash
# na raiz do projeto
git checkout -b feature/deploy-setup
git add -A
git commit -m "chore: deploy setup (Tailwind, env-based signaling URL, CORS for prod)" \
            -m "Use VITE_SIGNALING_SERVER on client and FRONTEND_ORIGIN on server"
git push -u origin feature/deploy-setup
# abra PR no GitHub e faça merge para main
```

## 4) Deploy do servidor (Render)

1. Acesse https://dashboard.render.com → New → Web Service
2. Selecione o repositório e a pasta raiz do serviço: `server`
3. Definições:
   - Runtime: Node 20+ (ou 22 LTS)
   - Build command: `npm install`
   - Start command: `node server.js`
   - Environment: defina as variáveis listadas acima
4. Deploy e copie a URL gerada, ex.: `https://SEU-SINAL.onrender.com`
5. Health check opcional:

```bash
curl -s https://SEU-SINAL.onrender.com/health
```

## 5) Deploy do frontend (Vercel)

1. Acesse https://vercel.com → New Project → importe o repositório (root)
2. Preset: Vite + React (Typescript)
3. Build & Output:
   - Build command: `npm run build`
   - Output dir: `dist`
4. Environment Variables: defina `VITE_SIGNALING_SERVER` com a URL da Render
5. Conclua o deploy e copie a URL gerada, ex.: `https://SEU-APP.vercel.app`

## 6) Teste ponta a ponta

- Abra duas abas em `https://SEU-APP.vercel.app`
- Crie a sala (aba 1) e entre com o ID (aba 2)
- Envie mensagens
- Se aparecer CORS, confira se `FRONTEND_ORIGIN` (Render) bate exatamente com a URL da Vercel

## 7) Execução local (inalterado)

```bash
# terminal 1 – servidor de sinalização
npm run dev:server

# terminal 2 – frontend
npm run dev
```

Opcional `.env.local` no frontend (fallback já está no código):

```env
VITE_SIGNALING_SERVER=http://localhost:3001
```

## 8) Detalhes de configuração no código

- Frontend (`src/hooks/useWebRTC.ts`):
  - `const SIGNALING_URL = import.meta.env.VITE_SIGNALING_SERVER ?? "http://localhost:3001";`
- Servidor (`server/server.js`):
  - CORS usa `allowedOrigins` com `process.env.FRONTEND_ORIGIN` + localhost

## 9) Observações

- Produção sempre em HTTPS; use `https://` em `VITE_SIGNALING_SERVER`
- Render free pode "acordar" ao primeiro acesso (latência na primeira chamada)
- Considerar TURN (futuro) para cenários de NAT restrito
