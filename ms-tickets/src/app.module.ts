import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsModule } from './tickets/tickets.module';
import { Ticket } from './tickets/entities/ticket.entity';
import { ThrottlerModule } from '@nestjs/throttler';
import { SseModule } from './sse/sse.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USUARIO'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NOMBRE'),
        entities: [Ticket],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    TicketsModule,
    SseModule
  ],
})
export class AppModule {}