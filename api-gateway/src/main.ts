import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT || 3005;
  const server = process.env.SERVER_HOST || 'http://localhost';
  await app.listen(port);
  console.log(`🚀 API Gateway running on port ${port}`);
  console.log('Rutas públicas:');
  console.log(`POST ${server}:${port}/auth/login`);
  console.log(`POST ${server}:${port}/auth/refresh`);
  console.log(`GET ${server}:${port}/routes`);
}
bootstrap();
