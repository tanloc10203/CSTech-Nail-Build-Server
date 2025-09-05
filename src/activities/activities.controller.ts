import { OK } from '@app/utils/success-response.util';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { EditTurnDto } from './dto/edit-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Activity } from './schemas/activities.schema';

@Controller('activities')
@ApiTags('Activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create activity' })
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activities' })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    required: false,
    enum: ['order', 'firstOrder'],
  })
  async findAll(@Query('sortBy') sortBy: keyof Activity) {
    return new OK({
      metadata: await this.activitiesService.findAll(sortBy),
      message: 'Activities found successfully',
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update activity' })
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Patch('edit-turn/:id')
  @ApiOperation({ summary: 'Edit turn' })
  editTurn(@Param('id') id: string, @Body() editData: EditTurnDto) {
    return this.activitiesService.editTotalTurn(id, editData.turn);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete activity' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
