# Dockerfile multi-stage para otimizar o build

# Stage 1: Build do frontend React
FROM node:18-alpine AS frontend-build
WORKDIR /app

# Copia package.json e instala dependências do frontend
COPY package*.json ./
RUN npm install

# Copia código fonte e faz build
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
RUN npm run build

# Stage 2: Setup do servidor de sinalização
FROM node:18-alpine AS server-build
WORKDIR /app/server

# Copia e instala dependências do servidor
COPY server/package*.json ./
RUN npm install --only=production

# Copia código do servidor
COPY server/server.js ./

# Stage 3: Imagem final
FROM node:18-alpine AS production
WORKDIR /app

# Instala serve para servir arquivos estáticos
RUN npm install -g serve

# Copia build do frontend
COPY --from=frontend-build /app/dist ./dist

# Copia servidor
COPY --from=server-build /app/server ./server

# Cria script de inicialização
RUN echo '#!/bin/sh\n\
# Inicia servidor de sinalização em background\n\
cd /app/server && node server.js &\n\
# Inicia servidor de arquivos estáticos\n\
cd /app && serve -s dist -l 3000' > /app/start.sh

RUN chmod +x /app/start.sh

# Expõe portas
EXPOSE 3000 3001

# Comando de inicialização
CMD ["/app/start.sh"]
