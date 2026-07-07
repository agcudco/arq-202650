import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuditService } from './audit.service';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';

@Controller('audit')
@UseGuards(ThrottlerGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(@Body() dto: CreateAuditEventDto) {
    return this.auditService.create(dto);
  }

  @Get()
  findAll() {
    return this.auditService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
