<p align="center">
  <img src="https://nestjs.com/img/logo_text.svg" alt="NestJS Logo" width="320"/>
</p>

# Backend - Pastelería (Proyecto 2do Año)

Este es el backend de un sistema de gestión de usuarios, autenticación y productos para una pastelería, desarrollado con **NestJS**, **Prisma** y **JWT**.

---

## 🚀 Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL (o SQLite para pruebas)
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
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/pasteleria"
   JWT_SECRET="tu_clave_secreta"
   JWT_EXPIRES_IN="10m"
   SALT=10
   ```

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

- `src/auth/` - Autenticación (login, registro, guards, JWT, DTOs)
- `src/prisma/` - Configuración y servicio de Prisma ORM
- `src/category/` - Gestión de categorías de productos
- `src/products/` - Gestión de productos
- `uploads/` - Imágenes subidas de productos

---

## 🔑 Variables de entorno necesarias (.env)

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/pasteleria"
JWT_SECRET="tu_clave_secreta"
JWT_EXPIRES_IN="10m"
SALT=10
```

---

## 🛠️ Comandos útiles

- `npm run start:dev` - Inicia el servidor en modo desarrollo
- `npx prisma studio` - Abre Prisma Studio para gestionar la base de datos
- `npx prisma migrate dev` - Aplica migraciones de la base de datos

---

## 🔒 Seguridad y autenticación

- Las rutas protegidas requieren autenticación mediante JWT (cookie httpOnly).
- El login y registro validan los datos y las contraseñas se almacenan hasheadas.
- Usa guards personalizados para proteger endpoints sensibles.

---

## 📚 Ejemplos de Endpoints

### Login
```bash
POST /auth/login
Content-Type: application/json
{
  "email": "usuario@correo.com",
  "password": "123456"
}
```

### Registro
```bash
POST /auth/register
Content-Type: application/json
{
  "name": "Usuario",
  "email": "usuario@correo.com",
  "password": "123456",
  "repeatPassword": "123456"
}
```

### Obtener productos
```bash
GET /products
```

### Crear producto (requiere autenticación y envío de imagen)
```bash
POST /products
Headers: Cookie: jwt=<token>
Body (form-data):
  name: "Torta de chocolate"
  price: 1000
  image: <archivo>
```

---

## 🗂️ Descripción de carpetas principales

- `src/auth/` - Lógica de autenticación y autorización (JWT, guards, DTOs)
- `src/prisma/` - Configuración y servicio de acceso a base de datos con Prisma
- `src/category/` - Gestión de categorías de productos
- `src/products/` - Gestión de productos y subida de imágenes
- `uploads/` - Carpeta donde se almacenan las imágenes subidas

---

## 📦 Despliegue

1. Configura las variables de entorno en producción.
2. Ejecuta las migraciones de Prisma en el entorno de producción.
3. Usa `npm run start:prod` para levantar el servidor en modo producción.

---

## 📫 Contacto

¿Dudas o sugerencias? Puedes abrir un issue en el repositorio o contactar al autor del proyecto.

---

<p align="center">
  <b>¡Feliz desarrollo con NestJS y Prisma! 🎂🚀</b>
</p>
