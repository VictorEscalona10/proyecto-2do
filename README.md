<p align="center">
  <img src="https://nestjs.com/img/logo_text.svg" alt="NestJS Logo" width="320"/>
</p>

# Backend - Proyecto 2do Año

Este es el backend de un sistema de autenticación y gestión de usuarios desarrollado con **NestJS**, **Prisma** y **JWT**.

---

## 🚀 Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL (o puedes usar SQLite para pruebas)
- [Nest CLI](https://docs.nestjs.com/cli/overview) (opcional, recomendado)

---

## ⚙️ Configuración Inicial

1. **Clona el repositorio y entra a la carpeta del backend:**

   ```bash
   git clone <url-del-repo>
   cd app/backend
   ```

2. **Instala las dependencias:**

   ```bash
   npm install
   ```

3. **Crea el archivo `.env` en la raíz de `backend/` con el siguiente contenido:**

   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="secretojwt"
   JWT_EXPIRES_IN="duracion"
   ```

   > Puedes cambiar `DATABASE_URL` a una conexión PostgreSQL si lo prefieres.

4. **Configura la base de datos con Prisma:**

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Inicia el servidor NestJS:**

   ```bash
   npm run start:dev
   ```

   El backend estará disponible en: `http://localhost:3000`

---

## 📁 Estructura Principal

- `src/auth/` - Lógica de autenticación (login, registro, guards, etc.)
- `src/prisma/` - Configuración de Prisma ORM
- `src/user/` - Módulo de usuarios

---

## 🔑 Variables de entorno necesarias (.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="secretojwt"
JWT_EXPIRES_IN="tiempo"
```

---

## 🛠️ Comandos útiles

- `npm run start:dev` - Inicia el servidor en modo desarrollo
- `npx prisma studio` - Abre Prisma Studio para gestionar la base de datos
- `npx prisma migrate dev` - Aplica migraciones de la base de datos

---

## 📬 Notas

- El backend está preparado para trabajar con un frontend en React (ver carpeta `../frontend`).
- Las rutas protegidas requieren autenticación mediante JWT (cookie httpOnly).
- Si tienes dudas, revisa los comentarios en el código o abre un issue.

---

<p align="center">
  <b>¡Feliz desarrollo con NestJS! 🚀</b>
</p>
