import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  // Cliente se conecta y une a su chat
  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string }
  ) {
    client.join(data.chatId);
    console.log(`Usuario ${data.userId} unido al chat ${data.chatId}`);
  }

  // Enviar mensaje
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { chatId: string; userId: string; text: string; isAdmin: boolean }
  ) {
    // Verificar permisos simples
    const chat = await this.prisma.chat.findFirst({
      where: { 
        id: data.chatId,
        status: 'active'
      }
    });

    if (!chat) return { error: 'Chat no encontrado' };

    // Solo participantes del chat pueden escribir
    if (data.isAdmin && chat.adminId !== data.userId) {
      return { error: 'No tienes permisos' };
    }
    if (!data.isAdmin && chat.clientId !== data.userId) {
      return { error: 'No tienes permisos' };
    }

    // Guardar mensaje
    const message = await this.prisma.message.create({
      data: {
        text: data.text,
        userId: data.userId,
        chatId: data.chatId,
        isAdmin: data.isAdmin
      }
    });

    // Enviar a todos en el chat
    this.server.to(data.chatId).emit('new_message', message);
    
    return { success: true, message };
  }

  // Cliente inicia nuevo chat
  @SubscribeMessage('start_chat')
  async handleStartChat(
    @MessageBody() data: { clientId: string; adminId: string }
  ) {
    const chat = await this.prisma.chat.create({
      data: {
        clientId: data.clientId,
        adminId: data.adminId
      }
    });

    return { success: true, chat };
  }

  // Obtener mensajes de un chat
  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @MessageBody() data: { chatId: string }
  ) {
    const messages = await this.prisma.message.findMany({
      where: { chatId: data.chatId },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, messages };
  }
}