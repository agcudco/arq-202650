import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: string;
  data: any;
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private eventSubject = new Subject<SseEvent>();

  /**
   * Observable para que los controladores lo suscriban
   */
  getEventStream() {
    return this.eventSubject.asObservable();
  }

  /**
   * Emitir un evento a todos los clientes conectados
   */
  emitEvent(type: string, data: any) {
    this.logger.log(`📡 Emitiendo evento SSE: ${type}`);
    this.eventSubject.next({ type, data });
  }
}
