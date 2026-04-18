import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HealthLogsService } from './health-logs.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CreateHealthLogDto } from './dto/create-health-log.dto';

interface AuthenticatedRequest extends Request {
  user: { firebaseUid: string; email: string };
}

@UseGuards(FirebaseAuthGuard)
@Controller('health-logs')
export class HealthLogsController {
  constructor(private readonly healthLogsService: HealthLogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateHealthLogDto,
  ) {
    return this.healthLogsService.create(req.user.firebaseUid, dto);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('since') since?: string,
  ) {
    return this.healthLogsService.findAll(req.user.firebaseUid, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      since,
    });
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.healthLogsService.findOne(req.user.firebaseUid, id);
  }
}
