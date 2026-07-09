import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import configuration from './config/configuration';
import { RoutesController } from './routes/routes.controller';
import { RoutesLoggerService } from './common/logger/routes-logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    ProxyModule,
  ],
  controllers: [RoutesController],
  providers: [RoutesLoggerService],
})
export class AppModule {}