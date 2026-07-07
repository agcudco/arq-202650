import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FactoryVehiculos } from './factory/factory-vehiculo';
import { AuditEvent, EventPublisher } from '../common/event-publisher.service';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private repositoryVehiculo: Repository<Vehiculo>,
    private eventPublisher: EventPublisher,
  ) {}

  // Método auxiliar para publicar eventos
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
      // usuario e ip se podrían obtener del contexto (request) si se inyecta
    };
    await this.eventPublisher.publish(event);
  }

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    const existe = await this.repositoryVehiculo.findOne({
      where: { placa: createVehiculoDto.datos.placa },
    });

    if (existe) {
      throw new Error('Ya existe un vehículo con esa placa');
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);
    const saved = await this.repositoryVehiculo.save(vehiculo);
    await this.emitEvent('CREATE', saved);
    return saved;

  }

  async findAll(): Promise<Vehiculo[]> {
    return this.repositoryVehiculo.find();
  }

  async findOne(id: string): Promise<Vehiculo> {
    const vehiculo = await this.repositoryVehiculo.findOne({ where: { id } });
    if (!vehiculo) {
      throw new Error('Vehículo no encontrado');
    }
    return vehiculo;
  }

  async update(id: string, actualizarDto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    if (actualizarDto.tipo && actualizarDto.tipo !== vehiculo.obtenerTipo()) {
      throw new BadRequestException('No se puede cambiar el tipo de vehículo');
    }
    // Guardar estado anterior para el evento (opcional)
    const estadoAnterior = { ...vehiculo };
    Object.assign(vehiculo, actualizarDto.datos);
    const updated = await this.repositoryVehiculo.save(vehiculo);
    // Publicar evento con estado anterior y nuevo
    await this.emitEvent('UPDATE', updated, { estadoAnterior });
    return updated;
  }

  remove(id: number) {
    return `This action removes a #${id} vehiculo`;
  }
}
