import { Created, OK } from '@app/utils/success-response.util';
import {
  Body,
  Controller,
  HttpCode,
  Param,
  Patch,
  Post
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateHistoryDto } from './dto/create-history.dto';
import { DoneHistoryDto } from './dto/done-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { HistoryService } from './history.service';

@Controller('history')
@ApiTags('History')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create history' })
  async create(@Body() createHistoryDto: CreateHistoryDto) {
    return new Created({
      message: 'History created successfully',
      metadata: await this.historyService.create(createHistoryDto),
    });
  }

  @Post('/done')
  @ApiOperation({ summary: 'Done history' })
  @HttpCode(200)
  async done(@Body() doneHistoryDto: DoneHistoryDto) {
    return new Created({
      message: 'History done successfully',
      metadata: await this.historyService.done(doneHistoryDto),
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update history' })
  async update(
    @Param('id') id: string,
    @Body() updateHistoryDto: UpdateHistoryDto,
  ) {
    return new OK({
      message: 'Update history successfully',
      metadata: await this.historyService.update(id, updateHistoryDto),
    });
  }
}
