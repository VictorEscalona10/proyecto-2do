FROM node:20-bookworm-slim AS builder
WORKDIR /usr/src/app

# Instalamos las librerías base necesarias para Prisma y Node
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma/

# Separamos la instalación de la generación para evitar bloqueos
RUN npm install --legacy-peer-deps --ignore-scripts
RUN npx prisma generate

# Copiamos el resto y compilamos
COPY . .
RUN npm run build

# ----------------------------------------
FROM node:20-bookworm-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Requisito de Prisma en el contenedor final
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Pasamos los archivos vitales
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:migrate:prod"]