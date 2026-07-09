import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { HttpClientService } from './common/httpl-client.service';
import { SseModule } from 'src/sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]),SseModule],
  controllers: [TicketsController],
  providers: [TicketsService, HttpClientService],
})
export class TicketsModule {}
