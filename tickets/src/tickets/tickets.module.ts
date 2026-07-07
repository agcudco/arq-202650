import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { HttpClientService } from './common/httpl-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [TicketsController],
  providers: [TicketsService, HttpClientService],
})
export class TicketsModule {}
