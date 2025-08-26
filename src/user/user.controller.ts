import { OK } from '@app/utils/success-response.util';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { SearchingAccountDto } from './dto/searching-account.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll() {
    const response = await this.userService.findAll();

    return new OK({
      message: 'Users found successfully',
      metadata: response,
    });
  }

  @Get('employees')
  @HttpCode(200)
  async getAllEmployees() {
    const response = await this.userService.getAllEmployees();

    return new OK({
      message: 'Get all employees successfully',
      metadata: response,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return new OK({
      message: 'Update user successfully',
      metadata: await this.userService.update(id, updateUserDto),
    });
  }

  @Post('search-account')
  @HttpCode(200)
  async searchingUserAccount(@Body() data: SearchingAccountDto) {
    const response = await this.userService.searchingUserAccount(data.value);

    return new OK({
      message: 'Users found successfully',
      metadata: response,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.delete(id);
    return new OK({
      message: 'User deleted successfully',
    });
  }
}
