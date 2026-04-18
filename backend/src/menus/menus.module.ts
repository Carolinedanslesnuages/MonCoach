import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { HealthLogsModule } from '../health-logs/health-logs.module';

@Module({
  imports: [HealthLogsModule],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
