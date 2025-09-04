import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { OK } from '@app/utils/success-response.util';
import { EditTurnDto } from './dto/edit-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  async findAll() {
    return new OK({
      metadata: await this.activitiesService.findAll(),
      message: 'Activities found successfully',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Patch('edit-turn/:id')
  editTurn(@Param('id') id: string, @Body() editData: EditTurnDto) {
    return this.activitiesService.editTotalTurn(id, editData.turn);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
