import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies.jwt;

    if (!token) return false;

    try {
      const decoded = this.jwtService.verify(token);
      (request as any).user = decoded; // aqui asigna manualmente el usuario a la solicitud
      return true;
    } catch (error) {
      return false;
    }
  }
}
