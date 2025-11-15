import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from './schemas/service.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { EventService } from '@src/event/event.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: mongoose.Model<Service>,
    private readonly eventService: EventService,
  ) { }

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
    const createdService = await this.serviceModel.create(createServiceDto);

    this.eventService.revalidateActivity();

    return createdService;
  }

  async update(
    id: string,
    updateServiceDto: CreateServiceDto,
  ): Promise<Service> {
    const updateService = await this.serviceModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      updateServiceDto,
      { new: true },
    );

    if (!updateService) {
      throw new NotFoundException('Service not found');
    }

    this.eventService.revalidateActivity();

    return updateService;
  }

  async remove(id: string): Promise<Service> {
    const deletedService = await this.serviceModel.findByIdAndDelete(
      new mongoose.Types.ObjectId(id),
    );

    if (!deletedService) {
      throw new NotFoundException('Service not found');
    }

    this.eventService.revalidateActivity();

    return deletedService;
  }
}
