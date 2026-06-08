import { ChildEntity, Column } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';

export enum TipoMotocicleta {
  Deportiva = 'Deportiva',
}

@ChildEntity('Motocicleta')
export class Motocicleta extends Vehiculo {
  @Column()
  tipo!: TipoMotocicleta;

  obtenerTipo(): string {
    return 'Auto';
  }
}
