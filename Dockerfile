FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# 1. Instalamos herramientas para compilar dependencias nativas
RUN apk add --no-cache python3 make g++

# 2. Copiamos los archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# 3. ¡Volvemos a npm ci! Ahora funcionará porque coincide con tu PC
RUN npm ci --ignore-scripts

# 4. Generamos Prisma
RUN npx prisma generate

# 5. Compilamos NestJS
COPY . .
RUN npm run build

# 6. Limpiamos dependencias de desarrollo
RUN npm prune --omit=dev

# ----------------------------------------
FROM node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copiamos solo el package.json
COPY package*.json ./

# 7. Pasamos los node_modules ya listos
COPY --from=builder /usr/src/app/node_modules ./node_modules

# 8. Copiamos los artefactos compilados y Prisma
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Ejecutamos migraciones e iniciamos
CMD ["npm", "run", "start:migrate:prod"]