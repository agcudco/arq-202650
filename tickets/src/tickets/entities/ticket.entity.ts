import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tickets')
export class Ticket {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'ABC-1234' })
  @Column()
  placa!: string;

  @ApiProperty({ example: '1234567890' })
  @Column()
  dni!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ type: 'uuid' })
  idEspacio!: string;

  @Column({ type: 'uuid' })
  idZona!: string;

  @Column()
  nombreZona!: string;

  @ApiProperty({ example: '2025-07-07T18:00:00.000Z' })
  @Column({ type: 'timestamp' })
  fechaHoraIngreso!: Date;

  @ApiProperty({ example: '2025-07-07T20:30:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  fechaHoraSalida!: Date;

  @ApiProperty({ example: true })
  @Column({ default: true })
  activo!: boolean;

  @ApiProperty({ example: 3.75 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorRecaudado!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
