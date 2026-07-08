import { ApiProperty } from '@nestjs/swagger';

export class TicketResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'ABC-1234' })
  placa!: string;

  @ApiProperty({ example: '1234567890' })
  dni!: string;

  @ApiProperty({
    example: { nombre: 'Juan', apellido: 'Pérez' },
    nullable: true,
  })
  datosPersona?: any;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  idEspacio!: string;

  @ApiProperty({ example: 'VIP' })
  zona!: string;

  @ApiProperty({ example: '2025-07-07T18:00:00.000Z' })
  fechaHoraIngreso!: Date;

  @ApiProperty({ example: '2025-07-07T20:30:00.000Z' })
  fechaHoraSalida!: Date;

  @ApiProperty({ example: 3.75 })
  valorRecaudado!: number;

  @ApiProperty({ example: true })
  activo!: boolean;

  @ApiProperty({ example: 2.5 })
  tiempoHoras!: number;
}
