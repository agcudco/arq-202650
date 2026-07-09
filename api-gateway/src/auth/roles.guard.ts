import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { routePermissions } from './route-roles.config';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // ✅ Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { method, path } = request;

    // Buscar permiso para esta ruta
    const permission = routePermissions.find(
      (p) => p.path.test(path) && p.methods.includes(method),
    );

    if (!permission) {
      throw new ForbiddenException('Ruta no configurada');
    }

    if (permission.roles === 'PUBLIC') {
      return true;
    }

    // Obtener token del header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new ForbiddenException('Token requerido');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ForbiddenException('Token inválido');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });
      const userRoles = payload.roles || [];
      const hasRole = permission.roles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(
          'No tienes permiso para acceder a este recurso',
        );
      }
      request.user = payload;
      return true;
    } catch (error) {
      // ✅ Type guard: verificar si es Error antes de acceder a .name
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new ForbiddenException('Token expirado');
      }
      throw new ForbiddenException('Token inválido');
    }
  }
}
