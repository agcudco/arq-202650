import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async validateUser(usernameOrDni: string, password: string): Promise<any> {
    const usersServiceUrl = this.configService.get('services.users');
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${usersServiceUrl}/api/users/login`, {
          usernameOrDni,
          password,
        }),
      );
      return response.data; // UserResponse con roles
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  async login(user: any) {
    const payload = {
      sub: user.userId,
      username: user.username,
      roles: user.roles,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.accessExpiration'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.refreshExpiration'),
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.userId,
        username: user.username,
        roles: user.roles,
        person: user.person,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });
      // Generar nuevo access token
      const newPayload = {
        sub: payload.sub,
        username: payload.username,
        roles: payload.roles,
      };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.accessExpiration'),
      });
      return { access_token: accessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}
