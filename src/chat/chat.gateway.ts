// chat.gateway.ts - VERSIÓN COMPLETA Y CORREGIDA
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  WsException,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JoinChatDto } from './dto/join-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetChatMessagesDto } from './dto/get-chat-messages.dto';
import { CloseChatDto } from './dto/close-chat.dto';
import { WebsocketAuthGuard } from './websocketsAuth.guard';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private adminSockets: Map<string, Socket> = new Map();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService
  ) { }

  // Este evento se llama automáticamente cuando un cliente se conecta
  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      this.logger.log(`Nueva conexión: ${client.id}, Token: ${!!token}`);

      // Si hay token, intentar verificar y autenticar
      if (token) {
        try {
          const payload = await this.jwtService.verify(token);
          client.data.user = payload;
          this.logger.log(`Cliente autenticado conectado: ${client.id}, usuario: ${payload.email}`);

          // Si es admin, registrarlo inmediatamente
          if (payload.role === 'ADMINISTRADOR' || payload.role === 'TRABAJADOR') {
            this.adminSockets.set(payload.email, client);
            this.logger.log(`Admin ${payload.email} registrado en conexión`);
          }
        } catch (error) {
          this.logger.warn(`Token inválido para cliente ${client.id}: ${error.message}`);
          // No desconectamos inmediatamente, solo no autenticamos
        }
      }
    } catch (error) {
      this.logger.error(`Error en conexión: ${error.message}`);
      // No desconectamos para permitir conexiones no autenticadas que puedan autenticarse después
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    // Remover de adminSockets si está presente
    for (const [email, socket] of this.adminSockets.entries()) {
      if (socket.id === client.id) {
        this.adminSockets.delete(email);
        this.logger.log(`Admin ${email} desconectado`);
        break;
      }
    }
  }

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('join_chat')
  async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() data: JoinChatDto) {
    try {
      const user = client.data.user;
      this.logger.log(`Usuario ${user.email} intentando unirse al chat ${data.chatId}`);

      const res = await this.chatService.joinChat(user, data);
      client.join(data.chatId);
      this.logger.log(`Usuario ${user.email} unido al chat ${data.chatId}`);
      return res;
    } catch (error) {
      this.logger.error(`Error en join_chat: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto
  ) {
    try {
      const user = client.data.user;
      this.logger.log(`Usuario ${user.email} enviando mensaje al chat ${data.chatId}`);

      const res = await this.chatService.sendMessage(user, data);

      // Enviar a todos en el chat
      this.server.to(data.chatId).emit('new_message', res.message);
      this.logger.log(`Mensaje enviado al chat ${data.chatId} por ${user.email}`);

      // Si el mensaje es del admin, notificar al cliente
      // Si es del cliente, notificar a los admins
      if (user.role === 'ADMINISTRADOR' || user.role === 'TRABAJADOR') {
        // El admin ya está en la sala del chat, pero podemos emitir un evento extra
        this.notifyAdminsAboutChatUpdate(data.chatId);
      } else {
        // Si es mensaje de cliente, notificar a los admins
        this.notifyAdminsAboutChatUpdate(data.chatId);
      }

      return res;
    } catch (error) {
      this.logger.error(`Error en send_message: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('start_chat')
  async handleStartChat(@ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user;
      this.logger.log(`Usuario ${user.email} iniciando nuevo chat`);

      // Solo clientes pueden iniciar chats
      if (user.role !== 'USUARIO') {
        this.logger.warn(`Usuario ${user.email} (rol: ${user.role}) intentó iniciar chat`);
        throw new WsException('Solo los usuarios pueden iniciar chats');
      }

      const res = await this.chatService.startChat(user);

      // Unir al cliente al chat
      client.join(res.chat.id);

      // Notificar a todos los administradores sobre el nuevo chat
      this.notifyAdminsAboutNewChat(res.chat);

      this.logger.log(`Nuevo chat creado: ${res.chat.id}`);
      return res;
    } catch (error) {
      this.logger.error(`Error en start_chat: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('get_my_chats')
  async handleGetMyChats(@ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user;
      this.logger.log(`DEBUG: Usuario ${user.email} (rol: ${user.role}) solicitando sus chats`);
      this.logger.log(`DEBUG: User ID: ${user.id}, Tipo: ${typeof user.id}`);

      const res = await this.chatService.getMyChats(user);

      this.logger.log(`DEBUG: Encontrados ${res.chats?.length || 0} chats para ${user.email}`);

      // Si es admin, registrar su socket para notificaciones
      if (user.role === 'ADMINISTRADOR' || user.role === 'TRABAJADOR') {
        this.adminSockets.set(user.email, client);
        this.logger.log(`Admin ${user.email} registrado para notificaciones`);
      }

      return res;
    } catch (error) {
      this.logger.error(`Error en get_my_chats: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('get_chat_messages')
  async handleGetChatMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GetChatMessagesDto
  ) {
    try {
      const user = client.data.user;
      this.logger.log(`Usuario ${user.email} solicitando mensajes del chat ${data.chatId}`);

      const res = await this.chatService.getChatMessages(user, data);
      this.logger.log(`Encontrados ${res.messages.length} mensajes para chat ${data.chatId}`);
      return res;
    } catch (error) {
      this.logger.error(`Error en get_chat_messages: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('close_chat')
  async handleCloseChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CloseChatDto
  ) {
    try {
      const user = client.data.user;

      // Solo administradores pueden cerrar chats
      if (user.role !== 'ADMINISTRADOR' && user.role !== 'TRABAJADOR') {
        throw new WsException('No tienes permisos para cerrar chats');
      }

      const res = await this.chatService.closeChat(user, data);

      // Notificar a todos en el chat que fue cerrado
      this.server.to(data.chatId).emit('chat_closed', {
        chatId: data.chatId,
        closedBy: user.email,
      });

      // Notificar a todos los admins sobre el chat cerrado
      this.notifyAdminsAboutChatUpdate(data.chatId);

      return res;
    } catch (error) {
      this.logger.error(`Error cerrando chat: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('admin_connected')
  async handleAdminConnected(@ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user;

      // Solo para admins
      if (user.role !== 'ADMINISTRADOR' && user.role !== 'TRABAJADOR') {
        return { success: false, message: 'Solo administradores pueden usar esta función' };
      }

      // Registrar socket del admin
      this.adminSockets.set(user.email, client);
      this.logger.log(`Admin ${user.email} conectado y registrado`);

      return { success: true, message: 'Admin registrado para notificaciones' };
    } catch (error) {
      this.logger.error(`Error en admin_connected: ${error.message}`);
      throw error;
    }
  }

  // Métodos auxiliares
  private extractTokenFromSocket(client: Socket): string | null {
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const jwtCookie = cookies.split(';').find(c => c.trim().startsWith('jwt='));
      if (jwtCookie) {
        return jwtCookie.split('=')[1];
      }
    }

    // También verificar headers de autorización por si acaso
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  // Notificar a todos los admins sobre nuevo chat
  private notifyAdminsAboutNewChat(chat: any) {
    this.logger.log(`Notificando a admins sobre nuevo chat: ${chat.id}`);

    this.adminSockets.forEach((socket, email) => {
      try {
        socket.emit('new_chat_created', chat);
        this.logger.log(`Notificado admin ${email} sobre nuevo chat`);
      } catch (error) {
        this.logger.error(`Error notificando a admin ${email}: ${error.message}`);
      }
    });
  }

  // Notificar a todos los admins sobre actualización de chat
  private notifyAdminsAboutChatUpdate(chatId: string) {
    this.logger.log(`Notificando a admins sobre actualización de chat: ${chatId}`);

    this.adminSockets.forEach((socket, email) => {
      try {
        socket.emit('chat_updated', { chatId, updatedAt: new Date().toISOString() });
      } catch (error) {
        this.logger.error(`Error notificando a admin ${email}: ${error.message}`);
      }
    });
  }
}