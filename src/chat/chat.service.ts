import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from 'src/prisma/prisma.service';
import { JoinChatDto } from './dto/join-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetChatMessagesDto } from './dto/get-chat-messages.dto';
import { CloseChatDto } from './dto/close-chat.dto';

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);

	constructor(private prisma: PrismaService) {}

	private toStringId(id: any) {
		return id?.toString?.() ?? String(id);
	}

		async canAccessChat(user: any, chatId: string) {
		const userId = this.toStringId(user.id);
		const chat = await this.prisma.chat.findFirst({
			where: {
				id: chatId,
				OR: [{ clientId: userId }, { adminId: userId }],
			},
		});
		return chat;
	}

		async joinChat(user: any, dto: JoinChatDto) {
			const chat = await this.canAccessChat(user, dto.chatId);
			if (!chat) {
				this.logger.warn(`Usuario ${user?.email} no tiene acceso al chat ${dto.chatId}`);
				throw new WsException('No tienes acceso a este chat');
			}
			return { success: true, chat, message: 'Unido al chat correctamente' };
	}

		async sendMessage(user: any, dto: SendMessageDto) {
			const chat = await this.prisma.chat.findFirst({ where: { id: dto.chatId, status: 'active' } });
			if (!chat) {
				this.logger.warn(`Chat ${dto.chatId} no encontrado`);
				throw new WsException('Chat no encontrado');
			}

			const userId = this.toStringId(user.id);
			const isAdmin = user.role === 'ADMINISTRADOR' || user.role === 'TRABAJADOR';
			const hasAccess = isAdmin ? chat.adminId === userId : chat.clientId === userId;

			if (!hasAccess) {
				this.logger.warn(`Usuario ${user?.email} no tiene permisos para escribir en chat ${dto.chatId}`);
				throw new WsException('No tienes permisos para escribir en este chat');
			}

			const message = await this.prisma.message.create({
				data: {
					text: dto.text,
					userId,
					chatId: dto.chatId,
					isAdmin,
				},
			});

			const messageWithUser = {
				...message,
				userName: user.name || user.email,
				userRole: user.role,
			};

			this.logger.log(`Mensaje guardado en DB para chat ${dto.chatId} por ${user?.email}`);
			return { success: true, message: messageWithUser };
		}

	async startChat(user: any) {
		if (user.role !== 'USUARIO') {
			this.logger.warn(`Usuario ${user?.email} (rol: ${user?.role}) intentó iniciar chat`);
			throw new WsException('Solo los usuarios pueden iniciar chats');
		}

		const clientId = this.toStringId(user.id);

		const existingChat = await this.prisma.chat.findFirst({
			where: { clientId, status: 'active' },
			include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
		});

		if (existingChat) {
			this.logger.log(`Cliente ${user?.email} ya tiene chat activo: ${existingChat.id}`);
			return { success: true, chat: existingChat, isNew: false, message: 'Chat existente recuperado' };
		}

		const admin = await this.prisma.user.findFirst({ where: { role: 'ADMINISTRADOR' } });
		if (!admin) {
			this.logger.error('No hay administradores disponibles en la base de datos');
			throw new WsException('No hay administradores disponibles');
		}

		const adminId = this.toStringId(admin.id);

		const chat = await this.prisma.chat.create({
			data: { clientId, adminId },
			include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
		});

		this.logger.log(`Nuevo chat creado: ${chat.id} para cliente ${clientId} y admin ${adminId}`);
		return { success: true, chat, isNew: true, message: 'Nuevo chat creado' };
	}

	async getMyChats(user: any) {
		const userId = this.toStringId(user.id);
		const chats = await this.prisma.chat.findMany({
			where: { OR: [{ clientId: userId }, { adminId: userId }], status: 'active' },
			include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
			orderBy: { createdAt: 'desc' },
		});
		return { success: true, chats };
	}

		async getChatMessages(user: any, dto: GetChatMessagesDto) {
			const chat = await this.canAccessChat(user, dto.chatId);
			if (!chat) {
				this.logger.warn(`Usuario ${user?.email} no tiene acceso al chat ${dto.chatId}`);
				throw new WsException('No tienes acceso a este chat');
			}

			const messages = await this.prisma.message.findMany({ where: { chatId: dto.chatId }, orderBy: { createdAt: 'asc' } });
			return { success: true, messages };
		}

		async closeChat(user: any, dto: CloseChatDto) {
			if (user.role !== 'ADMINISTRADOR' && user.role !== 'TRABAJADOR') {
				throw new WsException('No tienes permisos para cerrar chats');
			}

			const chat = await this.prisma.chat.update({ where: { id: dto.chatId }, data: { status: 'closed' } });
			this.logger.log(`Chat ${dto.chatId} cerrado por ${user?.email}`);
			return { success: true, chat, message: 'Chat cerrado correctamente' };
		}
}
