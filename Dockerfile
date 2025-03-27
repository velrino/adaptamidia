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

COPY --from=builder /app/dist ./dist

# Opcional: copiar arquivos estáticos, se necessário
# COPY --from=builder /app/public ./public

EXPOSE 8080

ENV NODE_ENV=production
CMD ["node", "dist/main"]
