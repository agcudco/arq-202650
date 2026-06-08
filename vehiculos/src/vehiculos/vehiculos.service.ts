import { Injectable } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FactoryVehiculos } from './factory/factory-vehiculo';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private repositoryVehiculo: Repository<Vehiculo>,
  ) {}

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    const existe = await this.repositoryVehiculo.findOne({
      where: { placa: createVehiculoDto.datos.placa },
    });

    if (existe) {
      throw new Error('Ya existe un vehículo con esa placa');
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);

    return this.repositoryVehiculo.save(vehiculo);
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

  update(id: number, updateVehiculoDto: UpdateVehiculoDto) {
    return `This action updates a #${id} vehiculo`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehiculo`;
  }
}
