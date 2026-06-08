import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TipoMotocicleta } from '../entities/motocicleta.entity';
import { Type } from 'class-transformer';

class BaseVehiculoDto {
  @IsString()
  @Matches(/^[A-Z]{3}-\d{4}$/, {
    message: 'La placa debe tener el formato ABC-1234',
  })
  placa!: string;

  @IsString()
  @IsNotEmpty({ message: 'La marca no puede estar vacía' })
  @MinLength(3, { message: 'La marca debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'La marca no puede tener más de 15 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El campo solo debe contener letras y espacios.',
  })
  marca!: string;

  @IsString()
  @IsNotEmpty({ message: 'El modelo no puede estar vacío' })
  @MinLength(3, { message: 'El modelo debe tener al menos 3 caracteres' })
  @MaxLength(20, { message: 'El modelo no puede tener más de 20 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El campo solo debe contener letras y espacios.',
  })
  modelo!: string;

  @IsString()
  @IsNotEmpty({ message: 'El color no puede estar vacío' })
  @MinLength(4, { message: 'El color debe tener al menos 4 caracteres' })
  @MaxLength(20, { message: 'El color no puede tener más de 20 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El campo solo debe contener letras y espacios.',
  })
  color!: string;

  @IsNumber()
  @Min(1900, { message: 'El año debe ser mayor o igual a 1900' })
  @IsInt({ message: 'El año debe ser un número entero' })
  anio!: number;
}

class AutoDto extends BaseVehiculoDto {
  @IsNumber()
  @Min(2, { message: 'El número de puertas debe ser al menos 2' })
  @Max(5, { message: 'El número de puertas no puede ser mayor a 5' })
  @IsInt({ message: 'El número de puertas debe ser un número entero' })
  numeroPuertas!: number;

  @IsNumber()
  @Min(100, {
    message: 'La capacidad del maletero debe ser al menos 100 litros',
  })
  @Max(1000, {
    message: 'La capacidad del maletero no puede ser mayor a 1000 litros',
  })
  capacidadMaletero!: number;
}

class MotoDto extends BaseVehiculoDto {
  @IsString()
  @Matches(/^[A-Z]{2}-\d{3}^[A-Z]$/, {
    message: 'La placa debe tener el formato AB-123A',
  })
  declare placa: string;

  @IsNotEmpty({ message: 'El tipo de motocicleta no puede estar vacío' })
  @IsEnum(TipoMotocicleta, {
    message: `El tipo de motocicleta debe ser uno de los siguientes: ${Object.values(TipoMotocicleta).join(', ')}`,
  })
  tipo!: TipoMotocicleta;
}

class CamionetaDto extends BaseVehiculoDto {
  @IsString()
  @IsNotEmpty({ message: 'El campo cabina no puede estar vacío' })
  @MinLength(5, { message: 'El campo cabina debe tener al menos 5 caracteres' })
  @MaxLength(15, {
    message: 'El campo cabina no puede tener más de 15 caracteres',
  })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El campo solo debe contener letras y espacios.',
  })
  cabina!: string;

  @IsNumber()
  @Min(100, {
    message: 'La capacidad del maletero debe ser al menos 100 toneladas',
  })
  @Max(1000, {
    message: 'La capacidad del maletero no puede ser mayor a 1000 toneladas',
  })
  capacidadCarga!: number;
}

export class CreateVehiculoDto {
  @IsIn(['Auto', 'Moto', 'Camioneta'])
  tipo!: string;

  @ValidateNested()
  @Type((opts) => {
    const object = opts?.object as CreateVehiculoDto;
    if (!object) return BaseVehiculoDto;

    switch (object.tipo) {
      case 'auto':
        return AutoDto;
      case 'motocicleta':
        return MotoDto;
      case 'camion':
        return CamionetaDto;
      default:
        return BaseVehiculoDto;
    }
  })
  datos!: AutoDto | MotoDto | CamionetaDto;
}
