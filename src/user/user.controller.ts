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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @HttpCode(200)
  async findAll() {
    const response = await this.userService.findAll();

    return new OK({
      message: 'Users found successfully',
      metadata: response,
    });
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get all employees' })
  @HttpCode(200)
  async getAllEmployees() {
    const response = await this.userService.getAllEmployees();

    return new OK({
      message: 'Get all employees successfully',
      metadata: response,
    });
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return new OK({
      message: 'Update user successfully',
      metadata: await this.userService.update(id, updateUserDto),
    });
  }

  @Post('search-account')
  @ApiOperation({ summary: 'Search user account' })
  @HttpCode(200)
  async searchingUserAccount(@Body() data: SearchingAccountDto) {
    const response = await this.userService.searchingUserAccount(data.value);

    return new OK({
      message: 'Users found successfully',
      metadata: response,
    });
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    await this.userService.delete(id);
    return new OK({
      message: 'User deleted successfully',
    });
  }
}
