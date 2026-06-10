import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { Vehiculo } from "../vehiculos/entities/vehiculo.entity";
import { Auto } from "../vehiculos/entities/auto.entity";
import { Motocicleta } from "../vehiculos/entities/motocicleta.entity";
import { Camioneta } from "../vehiculos/entities/camioneta.entity";


export const entities = [Vehiculo, Auto, Motocicleta, Camioneta];