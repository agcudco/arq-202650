import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Vehiculo } from './entities/vehiculo.entity';

@ApiTags('vehiculos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo vehículo' })
  @ApiBody({ type: CreateVehiculoDto })
  @ApiResponse({
    status: 201,
    description: 'Vehículo creado exitosamente',
    type: Vehiculo,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Placa ya existe' })
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculosService.create(createVehiculoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los vehículos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de vehículos',
    type: [Vehiculo],
  })
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por ID (UUID)' })
  @ApiParam({
    name: 'id',
    description: 'UUID del vehículo',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehículo encontrado',
    type: Vehiculo,
  })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Buscar vehículo por placa' })
  @ApiParam({
    name: 'placa',
    description: 'Placa del vehículo (ej. ABC-1234 o AB-123A)',
    example: 'ABC-1234',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehículo encontrado',
    type: Vehiculo,
  })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  async findByPlaca(@Param('placa') placa: string) {
    return this.vehiculosService.findByPlaca(placa);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un vehículo (parcial)' })
  @ApiParam({ name: 'id', description: 'UUID del vehículo' })
  @ApiBody({ type: UpdateVehiculoDto })
  @ApiResponse({
    status: 200,
    description: 'Vehículo actualizado',
    type: Vehiculo,
  })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'No se puede cambiar el tipo de vehículo',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.update(id, updateVehiculoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un vehículo' })
  @ApiParam({ name: 'id', description: 'UUID del vehículo' })
  @ApiResponse({ status: 204, description: 'Vehículo eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.vehiculosService.remove(id);
  }
}
