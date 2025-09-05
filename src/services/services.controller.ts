import { Created, OK } from '@app/utils/success-response.util';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServicesService } from './services.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('services')
@ApiTags('Services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get all services' })
  async findAll(@Res() res: Response) {
    return new OK({
      message: 'Services found successfully',
      metadata: await this.servicesService.findAll(),
    }).send(res);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get service by id' })
  async findById(@Res() res: Response, @Param('id') id: string) {
    return new OK({
      message: 'Service found successfully',
      metadata: await this.servicesService.findById(id),
    }).send(res);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete service by id' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    return new OK({
      message: 'Service deleted successfully',
      metadata: await this.servicesService.remove(id),
    }).send(res);
  }

  @Post('/')
  @ApiOperation({ summary: 'Create service' })
  async create(
    @Res() res: Response,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return new Created({
      message: 'Service created successfully',
      metadata: await this.servicesService.create(createServiceDto),
    }).send(res);
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update service by id' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return new OK({
      message: 'Service updated successfully',
      metadata: await this.servicesService.update(id, createServiceDto),
    }).send(res);
  }
}
