FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# 1. Instalamos las herramientas para compilar dependencias nativas (como bcrypt)
RUN apk add --no-cache python3 make g++

# 2. Copiamos solo lo necesario para instalar dependencias
COPY package*.json ./
COPY prisma ./prisma/

# 3. Instalamos TODAS las dependencias. 
# Usamos --ignore-scripts para evitar que tu "postinstall" salte a destiempo.
RUN npm ci --ignore-scripts

# 4. Generamos el cliente de Prisma explícitamente
RUN npx prisma generate

# 5. Copiamos el resto del código y compilamos Nest
COPY . .
RUN npm run build

# 🔥 6. EL TRUCO MAGIA: Eliminamos las dependencias de desarrollo.
# Como bcrypt ya se compiló con C++, se queda intacto y funcional.
# Como "prisma" está en tus dependencies normales, también se queda.
RUN npm prune --omit=dev

# ----------------------------------------
FROM node:18-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copiamos solo el package.json (útil para que npm run start:migrate:prod funcione)
COPY package*.json ./

# 7. Pasamos la carpeta node_modules ENTERA desde el builder. 
# Ya viene purgada, con el cliente Prisma generado y bcrypt compilado.
COPY --from=builder /usr/src/app/node_modules ./node_modules

# 8. Copiamos los archivos compilados de Nest y el esquema de la BD
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Ejecutamos las migraciones e iniciamos el servidor de forma segura
CMD ["npm", "run", "start:migrate:prod"]