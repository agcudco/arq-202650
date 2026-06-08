import { Module } from '@nestjs/common';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), VehiculosModule],
})
export class AppModule {}
