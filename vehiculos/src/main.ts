import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


    // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Vehículos')
    .setDescription('Microservicio para gestionar vehículos (Auto, Moto, Camioneta)')
    .setVersion('1.0')
    .addTag('vehiculos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Ruta: http://localhost:3000/api


  await app.listen(process.env.PORT ?? 3000);

  console.log("la aplicación está corriendo en el puerto: "+process.env.PORT)
  console.log("La documentación de la api se encuentra en: http://localhost:3000/api")
}
bootstrap();
