import { All, Controller, Req, Res, Next, UseGuards } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ProxyService } from './proxy.service';
import { RolesGuard } from '../auth/roles.guard';

@Controller()
@UseGuards(RolesGuard)
export class ProxyController {
  constructor(private proxyService: ProxyService) {}

  @All('api/*')
  async handleRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const path = req.url;
      const result = await this.proxyService.forwardRequest(req, path);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  @All('sse/*')
  async handleSSE(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const path = req.url;
      const result = await this.proxyService.forwardRequest(req, path);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
