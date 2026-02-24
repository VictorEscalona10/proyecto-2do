FROM node:22-bookworm-slim AS builder
WORKDIR /usr/src/app

# 1. Instalamos OpenSSL (Requisito indispensable para que Prisma funcione en Debian)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 2. Copiamos archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# 3. Instalación rápida y limpia (Debian descargará los binarios pre-compilados)
RUN npm install --ignore-scripts

# 4. Generamos Prisma
RUN npx prisma generate

# 5. Compilamos NestJS
COPY . .
RUN npm run build

# 6. Limpiamos dependencias de desarrollo
RUN npm prune --omit=dev

# ----------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# 7. Instalamos OpenSSL también en la fase de producción
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# 8. Pasamos los archivos compilados y listos
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Ejecutamos migraciones e iniciamos
CMD ["npm", "run", "start:migrate:prod"]