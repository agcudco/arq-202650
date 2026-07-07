import { Vehiculo } from '../entities/vehiculo.entity';
import { Auto } from '../entities/auto.entity';
import { Camioneta } from '../entities/camioneta.entity';
import { CreateVehiculoDto } from '../dto/create-vehiculo.dto';
import { Motocicleta } from '../entities/motocicleta.entity';

export class FactoryVehiculos {
  static crear(dto: CreateVehiculoDto): Vehiculo {
    // Ahora usamos los mismos valores que espera el DTO: 'Auto', 'Moto', 'Camioneta'
    switch (dto.tipo) {
      case 'Auto':
        const auto = new Auto();
        Object.assign(auto, dto.datos);
        return auto;
      case 'Moto':
        const moto = new Motocicleta();
        Object.assign(moto, dto.datos);
        return moto;
      case 'Camioneta':
        const camioneta = new Camioneta();
        Object.assign(camioneta, dto.datos);
        return camioneta;
      default:
        throw new Error(`Tipo de vehículo no soportado: ${dto.tipo}`);
    }
  }
}