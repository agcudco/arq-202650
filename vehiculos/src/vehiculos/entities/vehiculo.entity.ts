import { Column, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';

export enum Clasificacion {
  ELECTRICO = 'Eléctrico',
  HIBRIDO = 'Híbrido',
  GASOLINA = 'Gasolina',
  DIESEL = 'Diésel',
}

@TableInheritance({ column: { type: 'varchar', name: 'tipo' } })
export abstract class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  placa!: string;

  @Column()
  marca!: string;

  @Column()
  modelo!: string;

  @Column()
  color!: string;

  @Column()
  anio!: number;

  @Column()
  clasificacion!: Clasificacion;

  abstract obtenerTipo(): string;
}
