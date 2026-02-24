FROM node:22-bookworm-slim AS builder
WORKDIR /usr/src/app

# Instalamos dependencias del sistema y OpenSSL (Requisito estricto de Prisma)
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copiamos TODOS los archivos de configuración primero
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma/

# Instalación limpia normal (sin omitir nada, sin ignorar scripts)
# Esto dejará que Prisma genere su cliente automáticamente gracias a tu postinstall
RUN npm install

# Copiamos el resto de tu código fuente
COPY . .

# Compilamos el proyecto (genera la carpeta /dist)
RUN npm run build

# ----------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Requisito de Prisma en producción
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiamos los archivos generados desde el builder
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Tu comando de arranque
CMD ["npm", "run", "start:migrate:prod"]