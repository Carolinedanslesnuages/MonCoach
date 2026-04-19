import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { HealthLogsModule } from '../health-logs/health-logs.module';
import { MealsModule } from '../meals/meals.module';

@Module({
  imports: [HealthLogsModule, MealsModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
