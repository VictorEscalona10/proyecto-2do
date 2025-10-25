// websocketsAuth.guard.ts - Agrega logs
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WebsocketAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromSocket(client);
    
    console.log('🔐 WebSocket Auth - Token encontrado:', !!token);
    
    if (!token) {
      console.log('❌ WebSocket Auth - No hay token');
      throw new WsException('No autenticado');
    }

    try {
      const payload = await this.jwtService.verify(token);
      console.log('✅ WebSocket Auth - Token válido para usuario:', payload.email);
      
      // Adjunta el usuario al socket para usarlo en los handlers
      client.data.user = payload;
      return true;
    } catch (error) {
      console.log('❌ WebSocket Auth - Token inválido:', error.message);
      throw new WsException('Token inválido o expirado');
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
    
    // También verificar headers de autorización por si acaso
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }
}