<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="NestJS Logo" /></a>
</p>

# Backend — Sistema de Gestión para Pastelería (NestJS + Prisma)

Este repositorio contiene el backend de la aplicación: una API REST y un sistema de chat en tiempo real. Está implementado en TypeScript con NestJS y Prisma y pensado para uso académico y desarrollo iterativo.

> Nota: este README fue ampliado para describir cambios recientes: la lógica del chat fue movida del Gateway a `ChatService`, se añadieron DTOs para mensajes WebSocket y hay un guard para autenticar sockets (`WebsocketAuthGuard`).

---

## Contenido del repositorio

- `src/` — código fuente del backend
- `src/chat/` — gateway, servicio, DTOs y guard del chat en tiempo real
- `src/auth/` — controladores y servicios de autenticación
- `src/prisma/` — módulo y servicio para inyectar Prisma
- `prisma/` — esquema y migraciones de Prisma
- `uploads/` — archivos subidos (imágenes, etc.)
- `package.json` — scripts y dependencias

---

## Descripción completa

Este backend cumple dos grandes responsabilidades:

1. API REST para gestionar usuarios, productos, órdenes y otras entidades del negocio.
2. Sistema de chat en tiempo real entre clientes y personal (administradores/trabajadores).

Arquitectura y patrones importantes:

- Módulos por dominio (separación clara entre `auth`, `users`, `products`, `orders`, `chat`, etc.).
- Servicios para la lógica de negocio; controladores/gateways para entrada/salida.
- Prisma para consultas y migraciones de BD.
- Uso de DTOs y `class-validator` para validar la entrada de datos.

### Autenticación y autorización

- Autenticación por JWT (generado en `/auth/login`).
- En el flujo actual se entrega el JWT al cliente (normalmente se guarda en una cookie `jwt`).
- Guards y decoradores controlan la autorización basada en roles (`USUARIO`, `TRABAJADOR`, `ADMINISTRADOR`).

### Chat en tiempo real — detalles

- El Gateway (`src/chat/chat.gateway.ts`) es responsable del transporte (socket.io) y de emitir/escuchar eventos.
- La lógica (validaciones, creación de chats/mensajes, reglas de acceso) vive en `src/chat/chat.service.ts`.
- DTOs para payloads WebSocket en `src/chat/dto/` (JoinChatDto, SendMessageDto, GetChatMessagesDto, CloseChatDto) y se recomiendan `ValidationPipe` para validar automáticamente.

Eventos principales del chat (socket.io):

- `start_chat` (cliente) -> inicia o recupera un chat para el usuario; el servidor une el socket a la sala del chat.
- `join_chat` (cliente) -> pide unirse a una sala (validación de pertenencia).
- `send_message` (cliente) -> envía mensaje; servidor lo persiste y emite `new_message` a la sala.
- `get_my_chats` (cliente) -> obtiene lista de chats activos del usuario.
- `get_chat_messages` (cliente) -> obtiene mensajes de un chat.
- `close_chat` (admin/trabajador) -> cierra el chat y emite `chat_closed`.

Ejemplo de payloads:

- `send_message`: { chatId: string, text: string }
- `join_chat`: { chatId: string }

Autenticación WebSocket:

- `WebsocketAuthGuard` valida el JWT enviado por cookie (`jwt`) durante el handshake. El usuario autenticado queda disponible en `client.data.user`.

---

## Instalación y puesta en marcha (rápida)

Requisitos: Node.js v18+, pnpm/npm/yarn, PostgreSQL (se recomienda Docker para desarrollo).

1. Clona el repo e instala dependencias:

```powershell
git clone https://github.com/VictorEscalona10/proyecto2do.git
cd backend
pnpm install
```

2. Copia el `.env` y ajusta variables:

```powershell
cp .env.example .env
```

3. Levanta la base de datos y aplica migraciones:

```powershell
docker-compose up -d
npx prisma migrate dev
```

4. Corre en modo desarrollo:

```powershell
pnpm run start:dev
```

---

## Variables de entorno importantes

- `DATABASE_URL` — URL de conexión a PostgreSQL
- `JWT_SECRET` — secreto para firmar tokens JWT
- `JWT_EXPIRES_IN` — tiempo de expiración del token
- `PORT` — puerto del servidor
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` — para el servicio de envío de correos

Revisa `.env.example` para valores sugeridos.

---

## Cómo probar el chat (cliente mínimo)

Puedes probar el chat con un pequeño cliente HTML/JS:

1. Haz login via API REST (`POST /auth/login`) y guarda la cookie `jwt` que retorna.
2. En el cliente usa socket.io-client y conecta con credenciales:

```html
<!-- ejemplo mínimo -->
<script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>
<script>
  const socket = io('http://localhost:3000', { withCredentials: true });

  socket.on('connect', () => console.log('conectado', socket.id));
  socket.emit('start_chat');
  socket.on('new_message', msg => console.log('nuevo mensaje', msg));
</script>
```

Si el JWT está en la cookie `jwt` y la conexión envía cookies (`withCredentials: true`), el guard debería autenticar el socket.

Si quieres, puedo añadir un cliente listo para pruebas en `tools/chat-client/` que haga login, guarde la cookie y permita enviar/recibir mensajes.

---

## Scripts disponibles

- `pnpm run start:dev` — desarrollo con hot-reload
- `pnpm run build` — compilar TS
- `pnpm run start:prod` — ejecutar la build
- `pnpm run test` — ejecutar pruebas

---

## Troubleshooting y notas comunes

- Si el socket no se autentica, verifica que la cookie `jwt` exista y que el cliente establezca `withCredentials`.
- Errores de Prisma: revisa `DATABASE_URL` y aplica migraciones con `npx prisma migrate dev`.
- Validaciones WebSocket: para que los DTOs se validen, añade `@UsePipes(new ValidationPipe({ transform: true }))` en los handlers del gateway.

---

## Contribuciones y desarrollo

Si vas a extender el proyecto: crea ramas por feature, agrega tests para la lógica del `ChatService` y preserva la separación entre gateway (I/O) y service (lógica).

---

## Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE`.

---

Si quieres que incorpore ejemplos concretos (cliente HTML/JS listo, scripts para pruebas end-to-end o snippets de Postman), los genero en el siguiente paso.

