import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { dni: string; password: string }) {
    // ✅ Validación manual
    if (!body.dni || !body.password) {
      throw new BadRequestException('DNI y password son requeridos');
    }
    const user = await this.authService.validateUser(body.dni, body.password);
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    if (!body.refresh_token) {
      throw new BadRequestException('Refresh token es requerido');
    }
    return this.authService.refreshToken(body.refresh_token);
  }
}