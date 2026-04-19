import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import { HealthLogsService } from '../health-logs/health-logs.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { HealthLog, Meal, Medication, Profile } from '@prisma/client';

type ProfileWithMedications = Profile & { medications: Medication[] };

@Injectable()
export class MealsService {
  private readonly logger = new Logger(MealsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly healthLogsService: HealthLogsService,
  ) {}

  private async resolveUser(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: { include: { medications: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private buildMealAnalysisPrompt(
    mealDescription: string,
    profile: ProfileWithMedications | null,
    recentLogs: HealthLog[],
  ): string {
    const focus = profile?.healthFocus?.join(', ') || 'general health';
    const meds =
      profile?.medications
        ?.map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`)
        .join(', ') || 'none';
    const medicalContext = profile?.medicalContext || 'not specified';

    const logSummary =
      recentLogs.length > 0
        ? recentLogs
            .map((l) => {
              const parts: string[] = [
                `Date: ${l.loggedAt.toISOString().split('T')[0]}`,
              ];
              if (l.systolic && l.diastolic)
                parts.push(`BP: ${l.systolic}/${l.diastolic} mmHg`);
              if (l.weightKg) parts.push(`Weight: ${l.weightKg} kg`);
              if (l.glycemia) parts.push(`Glycemia: ${l.glycemia} mmol/L`);
              if (l.hba1c) parts.push(`HbA1c: ${l.hba1c}%`);
              if (l.ldl) parts.push(`LDL: ${l.ldl} mmol/L`);
              if (l.crp) parts.push(`CRP: ${l.crp} mg/L`);
              if (l.ferritin) parts.push(`Ferritin: ${l.ferritin} ng/mL`);
              if (l.tsh) parts.push(`TSH: ${l.tsh} mIU/L`);
              if (l.hasEdema) parts.push('Edema: yes');
              if (l.hydrationLiters)
                parts.push(`Hydration: ${l.hydrationLiters} L`);
              return parts.join(', ');
            })
            .join('\n')
        : 'No recent health logs available.';

    return `You are a personalized health nutrition coach. Analyze the following meal for a patient with specific health conditions.

## Patient Profile
- Health focus areas: ${focus}
- Current medications: ${meds}
- Medical context: ${medicalContext}
- Height: ${profile?.heightCm ? `${profile.heightCm} cm` : 'not specified'}
- Weight: ${profile?.weightKg ? `${profile.weightKg} kg` : 'not specified'}

## Recent Health Data (last 7 days)
${logSummary}

## Meal to Analyze
"${mealDescription}"

## Instructions
Please provide:
1. **Nutritional Overview**: Estimated macros and key micronutrients in this meal.
2. **Health Impact**: How this meal may affect the patient's specific health conditions (focus on: ${focus}).
3. **Medication Interactions**: Any food-drug interactions to be aware of given the current medications.
4. **Recommendations**: Specific improvements or substitutions to better align with the patient's health goals.
5. **Overall Assessment**: A brief score (1-5) with a short summary.

Be concise, evidence-based, and avoid alarming language. Focus on practical, actionable advice.`;
  }

  async create(firebaseUid: string, dto: CreateMealDto): Promise<Meal> {
    const user = await this.resolveUser(firebaseUid);

    const recentLogs = await this.healthLogsService.findRecentLogs(user.id, 7);

    const prompt = this.buildMealAnalysisPrompt(
      dto.description,
      user.profile as ProfileWithMedications | null,
      recentLogs,
    );

    let aiAnalysis: string | undefined;
    try {
      aiAnalysis = await this.gemini.generateText(prompt);
    } catch (error) {
      this.logger.error(
        `Gemini meal analysis failed for user ${user.id}`,
        error,
      );
      aiAnalysis = undefined;
    }

    return this.prisma.meal.create({
      data: {
        userId: user.id,
        description: dto.description,
        mealType: dto.mealType,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
        aiAnalysis,
      },
    });
  }

  async findAll(
    firebaseUid: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Meal[]> {
    const user = await this.resolveUser(firebaseUid);

    return this.prisma.meal.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  async findOne(firebaseUid: string, mealId: string): Promise<Meal> {
    const user = await this.resolveUser(firebaseUid);

    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId: user.id },
    });

    if (!meal) throw new NotFoundException('Meal not found');
    return meal;
  }

  async findRecentMeals(userId: string, days: number = 15): Promise<Meal[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.meal.findMany({
      where: {
        userId,
        loggedAt: { gte: since },
      },
      orderBy: { loggedAt: 'desc' },
    });
  }
}
