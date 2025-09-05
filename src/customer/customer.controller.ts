import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Created, OK } from '@app/utils/success-response.util';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('customer')
@ApiTags('Customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    return new Created({
      message: 'Customer created successfully',
      metadata: await this.customerService.create(createCustomerDto),
    });
  }

  @Get()
  @ApiOperation({ summary: 'Find all customer' })
  async findAll() {
    return new OK({
      message: "Get customer's list successfully",
      metadata: await this.customerService.findAll(),
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(+id, updateCustomerDto);
  }
}
