FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Dependencias del sistema necesarias para compilar ciertos paquetes de Node
RUN apk add --no-cache python3 make g++

# Instalamos TODAS las dependencias para poder construir
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generamos el cliente de Prisma
RUN npx prisma generate

# Copiamos el código fuente y compilamos Nest
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copiamos package.json e instalamos SOLO dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# IMPORTANTE: Copiamos el cliente de Prisma ya generado desde el builder
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
# Instalamos el CLI de Prisma localmente para poder ejecutar las migraciones
RUN npm install prisma --no-save

# Copiamos los artefactos compilados y el schema
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Usamos el comando definido en tu docker-compose
CMD ["npm", "run", "start:migrate:prod"]