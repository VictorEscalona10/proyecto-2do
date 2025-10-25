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

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', "http://localhost:5173"],
    credentials: true
  }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private chatService: ChatService) { }

  // Este evento se llama automáticamente cuando un cliente se conecta
  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      this.logger.log(`Nueva conexión: ${client.id}, Token: ${!!token}`);

      if (token) {
        this.logger.log(`Cliente autenticado conectado: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`Error en conexión: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
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
      // Unir al cliente al chat (existente o nuevo)
      client.join(res.chat.id);
      return res;
    } catch (error) {
      this.logger.error(`Error en start_chat: ${error.message}`);
      throw error;
    }
  }

  // También modifica get_my_chats para que priorice el chat activo
  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('get_my_chats')
  async handleGetMyChats(@ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user;
      this.logger.log(`Usuario ${user.email} solicitando sus chats`);

      const res = await this.chatService.getMyChats(user);
      this.logger.log(`Encontrados ${res.chats.length} chats para usuario ${user.email}`);
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

  private extractTokenFromSocket(client: Socket): string | null {
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const jwtCookie = cookies.split(';').find(c => c.trim().startsWith('jwt='));
      if (jwtCookie) {
        return jwtCookie.split('=')[1];
      }
    }
    return null;
  }

  // En el backend - ChatGateway
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
      return res;
    } catch (error) {
      this.logger.error(`Error cerrando chat: ${error.message}`);
      throw error;
    }
  }
}