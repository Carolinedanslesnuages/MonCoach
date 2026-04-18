import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateUser(firebaseUid: string, email: string) {
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        profile: { include: { medications: true } },
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { firebaseUid, email },
        include: {
          profile: { include: { medications: true } },
        },
      });
    }

    return user;
  }

  async getProfile(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        profile: { include: { medications: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.profile;
  }

  async createProfile(firebaseUid: string, dto: CreateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      throw new ConflictException(
        'Profile already exists. Use PATCH to update.',
      );
    }

    const { medications, lastPeriodStart, ...profileData } = dto;

    return this.prisma.profile.create({
      data: {
        ...profileData,
        userId: user.id,
        lovedFoods: profileData.lovedFoods ?? [],
        hatedFoods: profileData.hatedFoods ?? [],
        lastPeriodStart: lastPeriodStart
          ? new Date(lastPeriodStart)
          : undefined,
        medications: medications?.length
          ? {
              create: medications.map((m) => ({
                name: m.name,
                dosage: m.dosage,
              })),
            }
          : undefined,
      },
      include: { medications: true },
    });
  }

  async updateProfile(firebaseUid: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      throw new NotFoundException('User or profile not found');
    }

    const { medications, lastPeriodStart, ...profileData } = dto;

    // Replace medications when provided: delete old, create new
    if (medications !== undefined) {
      await this.prisma.medication.deleteMany({
        where: { profileId: user.profile.id },
      });
    }

    return this.prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        ...profileData,
        lastPeriodStart: lastPeriodStart
          ? new Date(lastPeriodStart)
          : undefined,
        medications: medications?.length
          ? {
              create: medications.map((m) => ({
                name: m.name,
                dosage: m.dosage,
              })),
            }
          : undefined,
      },
      include: { medications: true },
    });
  }

  async getUserWithProfile(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        profile: { include: { medications: true } },
      },
    });
  }
}
