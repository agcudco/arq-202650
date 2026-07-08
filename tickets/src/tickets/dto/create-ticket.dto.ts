import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'ABC-1234', description: 'Placa del vehículo' })
  @IsString()
  @IsNotEmpty()
  placa!: string;

  @ApiProperty({ example: '1234567890', description: 'DNI del propietario' })
  @IsString()
  @IsNotEmpty()
  dni!: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del espacio (UUID)',
  })
  @IsUUID()
  @IsNotEmpty()
  idEspacio!: string;

}
