import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';
import { FactoryVehiculos } from './factory/factory-vehiculo';
import { AuditEvent, EventPublisher } from '../common/event-publisher.service';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private repositoryVehiculo: Repository<Vehiculo>,
    private eventPublisher: EventPublisher,
  ) {}

  /**
   * Método auxiliar para publicar eventos de auditoría
   */
  private async emitEvent(
    accion: string,
    vehiculo: Vehiculo,
    datosExtra?: any,
  ) {
    const event: AuditEvent = {
      servicio: 'vehiculos',
      accion,
      entidad: 'Vehiculo',
      datos: { ...vehiculo, ...datosExtra },
    };
    await this.eventPublisher.publish(event);
  }

  /**
   * Crear un nuevo vehículo
   */
  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    // Verificar si ya existe un vehículo con esa placa
    const existe = await this.repositoryVehiculo.findOne({
      where: { placa: createVehiculoDto.datos.placa },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe un vehículo con la placa ${createVehiculoDto.datos.placa}`,
      );
    }

    // Usar el factory para crear la instancia concreta
    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);
    const saved = await this.repositoryVehiculo.save(vehiculo);
    await this.emitEvent('CREATE', saved);
    return saved;
  }

  /**
   * Obtener todos los vehículos
   */
  async findAll(): Promise<Vehiculo[]> {
    return this.repositoryVehiculo.find();
  }

  /**
   * Obtener un vehículo por su ID (UUID)
   */
  async findOne(id: string): Promise<Vehiculo> {
    const vehiculo = await this.repositoryVehiculo.findOne({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }
    return vehiculo;
  }

  /**
   * Buscar un vehículo por su placa (única)
   */
  async findByPlaca(placa: string): Promise<Vehiculo> {
    const vehiculo = await this.repositoryVehiculo.findOne({
      where: { placa },
    });

    if (!vehiculo) {
      throw new NotFoundException(
        `No se encontró un vehículo con la placa ${placa}`,
      );
    }

    return vehiculo;
  }

  /**
   * Actualizar un vehículo (parcial)
   * No permite cambiar el tipo de vehículo
   */
  async update(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
  ): Promise<Vehiculo> {
    // Buscar el vehículo existente
    const vehiculo = await this.findOne(id);

    // Verificar si se intenta cambiar el tipo
    if (
      updateVehiculoDto.tipo &&
      updateVehiculoDto.tipo !== vehiculo.obtenerTipo()
    ) {
      throw new BadRequestException(
        `No se puede cambiar el tipo de vehículo (${vehiculo.obtenerTipo()} → ${updateVehiculoDto.tipo})`,
      );
    }

    // Guardar estado anterior para auditoría
    const estadoAnterior = { ...vehiculo };

    // Aplicar los cambios (solo los campos presentes)
    // Si se envía 'datos', asignamos sus propiedades al vehículo
    if (updateVehiculoDto.datos) {
      Object.assign(vehiculo, updateVehiculoDto.datos);
    }

    const updated = await this.repositoryVehiculo.save(vehiculo);
    await this.emitEvent('UPDATE', updated, { estadoAnterior });
    return updated;
  }

  /**
   * Eliminar un vehículo (físicamente)
   */
  async remove(id: string): Promise<void> {
    const vehiculo = await this.findOne(id);
    await this.repositoryVehiculo.delete(id);
    await this.emitEvent('DELETE', vehiculo);
  }
}
