import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class ProxyService {
  private serviceMap: Record<string, string>;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.serviceMap = {
      '/api/users': this.configService.get<string>('services.users')!,
      '/api/espacios': this.configService.get<string>('services.espacios')!,
      '/api/vehiculos': this.configService.get<string>('services.vehiculos')!,
      '/api/tickets': this.configService.get<string>('services.tickets')!,
      '/api/audit': this.configService.get<string>('services.audit')!,
      '/sse': this.configService.get<string>('services.tickets')!,
    };
  }

  private getServiceUrl(path: string): string | null {
    for (const [prefix, url] of Object.entries(this.serviceMap)) {
      if (path.startsWith(prefix)) {
        return url;
      }
    }
    return null;
  }

  async forwardRequest(req: Request, path: string) {
    const baseUrl = this.getServiceUrl(path);
    if (!baseUrl) {
      throw new HttpException('Servicio no encontrado', HttpStatus.NOT_FOUND);
    }

    const targetUrl = `${baseUrl}${path}`;
    const method = req.method;
    const headers = { ...req.headers } as any;
    delete headers.host;
    delete headers.connection;

    const body = req.body;
    const query = req.query;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          url: targetUrl,
          method,
          headers,
          data: body,
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      // Manejo seguro de error (unknown)
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response: { data: any; status: number } };
        throw new HttpException(
          err.response.data,
          err.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message || 'Error al comunicarse con el microservicio',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error al comunicarse con el microservicio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
