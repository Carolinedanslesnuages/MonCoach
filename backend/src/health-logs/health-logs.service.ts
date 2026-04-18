import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHealthLogDto } from './dto/create-health-log.dto';

@Injectable()
export class HealthLogsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUserId(firebaseUid: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.id;
  }

  async create(firebaseUid: string, dto: CreateHealthLogDto) {
    const userId = await this.resolveUserId(firebaseUid);

    return this.prisma.healthLog.create({
      data: {
        userId,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
        systolic: dto.systolic,
        diastolic: dto.diastolic,
        weightKg: dto.weightKg,
        glycemia: dto.glycemia,
        proteinuria: dto.proteinuria,
        ferritin: dto.ferritin,
        crp: dto.crp,
        tsh: dto.tsh,
        hba1c: dto.hba1c,
        ldl: dto.ldl,
        medicationLevel: dto.medicationLevel,
        hasEdema: dto.hasEdema ?? false,
        notes: dto.notes,
        medicationsTaken: dto.medicationsTaken ?? [],
        isPeriodStart: dto.isPeriodStart ?? false,
        hydrationLiters: dto.hydrationLiters,
      },
    });
  }

  async findAll(
    firebaseUid: string,
    options?: { limit?: number; offset?: number; since?: string },
  ) {
    const userId = await this.resolveUserId(firebaseUid);

    const where: {
      userId: string;
      loggedAt?: { gte: Date };
    } = { userId };

    if (options?.since) {
      where.loggedAt = { gte: new Date(options.since) };
    }

    return this.prisma.healthLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  async findOne(firebaseUid: string, logId: string) {
    const userId = await this.resolveUserId(firebaseUid);

    const log = await this.prisma.healthLog.findFirst({
      where: { id: logId, userId },
    });

    if (!log) throw new NotFoundException('Health log not found');
    return log;
  }

  async findRecentLogs(userId: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.healthLog.findMany({
      where: {
        userId,
        loggedAt: { gte: since },
      },
      orderBy: { loggedAt: 'desc' },
    });
  }
}
