import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from './schemas/service.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: mongoose.Model<Service>,
  ) {}

  async findAll(): Promise<Service[]> {
    return await this.serviceModel.find();
  }

  async findById(id: string): Promise<Service> {
    const foundService = await this.serviceModel.findById(
      new mongoose.Types.ObjectId(id),
    );

    if (!foundService) {
      throw new NotFoundException('Service not found');
    }

    return foundService;
  }

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    return await this.serviceModel.create(createServiceDto);
  }

  async update(
    id: string,
    updateServiceDto: CreateServiceDto,
  ): Promise<Service> {
    return await this.serviceModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      updateServiceDto,
      { new: true },
    );
  }

  async remove(id: string): Promise<Service> {
    return await this.serviceModel.findByIdAndDelete(
      new mongoose.Types.ObjectId(id),
    );
  }
}
