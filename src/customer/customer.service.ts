import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from './schemas/customer.schema';
import mongoose from 'mongoose';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: mongoose.Model<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    if (createCustomerDto.phone) {
      // check phone exist
      const exist = await this.customerModel
        .findOne({
          phone: createCustomerDto.phone,
        })
        .lean();

      if (exist) {
        throw new ConflictException('Customer phone already exist');
      }
    }

    if (createCustomerDto.email) {
      // check email exist
      const exist = await this.customerModel
        .findOne({
          email: createCustomerDto.email,
        })
        .lean();

      if (exist) {
        throw new ConflictException('Customer email already exist');
      }
    }

    const customer = new this.customerModel(createCustomerDto);
    return customer.save();
  }

  async findAll(): Promise<Customer[]> {
    return (await this.customerModel.find().lean()) as Customer[];
  }

  findOne(id: number) {
    return `This action returns a #${id} customer`;
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return `This action updates a #${id} customer`;
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}
