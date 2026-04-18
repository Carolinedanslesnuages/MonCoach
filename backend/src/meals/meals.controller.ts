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
import { MealsService } from './meals.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CreateMealDto } from './dto/create-meal.dto';

interface AuthenticatedRequest extends Request {
  user: { firebaseUid: string; email: string };
}

@UseGuards(FirebaseAuthGuard)
@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateMealDto) {
    return this.mealsService.create(req.user.firebaseUid, dto);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.mealsService.findAll(req.user.firebaseUid, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.mealsService.findOne(req.user.firebaseUid, id);
  }
}
