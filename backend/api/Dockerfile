# Etapa de build
FROM node:23.6.0-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa final
FROM node:23.6.0-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

# Add ffmpeg system binary (used for video optimization)
RUN apk add --no-cache ffmpeg

COPY resources/ ./resources/

COPY --from=builder /app/dist ./dist

# Opcional: copiar arquivos estáticos, se necessário
# COPY --from=builder /app/public ./public

EXPOSE 8080

ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
CMD ["node", "dist/main"]
