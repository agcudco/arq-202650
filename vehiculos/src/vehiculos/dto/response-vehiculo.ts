import { TipoMotocicleta } from '../entities/motocicleta.entity';
import { Clasificacion } from '../entities/vehiculo.entity';

export class ResponseVehiculo {
  id!: number;
  placa!: string;
  marca!: string;
  modelo!: string;
  anio!: number;
  color!: string;
  clasificacion!: Clasificacion;
  numeroPuertas!: number;
  capacidadMaletero!: number;
  cabina!: string;
  capacidadCarga!: number;
  tipo!: TipoMotocicleta;
}
