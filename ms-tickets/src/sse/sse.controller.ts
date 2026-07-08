import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { SseService } from './sse.service';
import { Observable, map } from 'rxjs';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('espacios')
  streamEspacios(): Observable<MessageEvent> {
    return this.sseService.getEventStream().pipe(
      map((event) => ({
        data: JSON.stringify(event),
        type: event.type,
      })),
    );
  }
}
