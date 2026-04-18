import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import { HealthLogsService } from '../health-logs/health-logs.service';
import { GenerateMenuDto } from './dto/generate-menu.dto';
import { HealthLog, Medication, Profile } from '@prisma/client';

type ProfileWithMedications = Profile & { medications: Medication[] };

@Injectable()
export class MenusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly healthLogsService: HealthLogsService,
  ) {}

  private buildMenuPrompt(
    profile: ProfileWithMedications | null,
    recentLogs: HealthLog[],
    date: string,
    additionalInstructions?: string,
  ): string {
    const focus = profile?.healthFocus?.join(', ') || 'general health';
    const loved = profile?.lovedFoods?.length
      ? profile.lovedFoods.join(', ')
      : 'not specified';
    const hated = profile?.hatedFoods?.length
      ? profile.hatedFoods.join(', ')
      : 'not specified';
    const meds =
      profile?.medications
        ?.map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`)
        .join(', ') || 'none';
    const medicalContext = profile?.medicalContext || 'not specified';

    const latestLog = recentLogs[0];
    const latestWeight = latestLog?.weightKg ?? profile?.weightKg;
    const bmi =
      profile?.heightCm && latestWeight
        ? (latestWeight / Math.pow(profile.heightCm / 100, 2)).toFixed(1)
        : 'unknown';

    const recentDataSummary =
      recentLogs.length > 0
        ? recentLogs
            .slice(0, 5)
            .map((l) => {
              const parts: string[] = [
                `${l.loggedAt.toISOString().split('T')[0]}`,
              ];
              if (l.systolic && l.diastolic)
                parts.push(`BP ${l.systolic}/${l.diastolic}`);
              if (l.glycemia) parts.push(`Glycemia ${l.glycemia}`);
              if (l.hba1c) parts.push(`HbA1c ${l.hba1c}%`);
              if (l.ldl) parts.push(`LDL ${l.ldl}`);
              if (l.crp) parts.push(`CRP ${l.crp}`);
              if (l.ferritin) parts.push(`Ferritin ${l.ferritin}`);
              if (l.tsh) parts.push(`TSH ${l.tsh}`);
              if (l.hasEdema) parts.push('Edema');
              return parts.join(' | ');
            })
            .join('\n')
        : 'No recent health data available.';

    const extra = additionalInstructions
      ? `\n## Additional Instructions\n${additionalInstructions}\n`
      : '';

    return `You are a personalized health nutrition coach. Generate a complete daily meal plan for the following patient.

## Patient Profile
- Health focus: ${focus}
- Medical context: ${medicalContext}
- Height: ${profile?.heightCm ? `${profile.heightCm} cm` : 'not specified'}
- Current weight: ${latestWeight ? `${latestWeight} kg` : 'not specified'}
- BMI: ${bmi}
- Loved foods: ${loved}
- Hated foods: ${hated}
- Current medications: ${meds}

## Recent Health Data (last 7 days)
${recentDataSummary}
${extra}
## Date
${date}

## Instructions
Generate a complete, personalized meal plan for this day including:

### 🌅 Breakfast
- Main dish with ingredients and estimated portions
- Drink suggestion
- Estimated calories and key nutrients

### 🥗 Lunch
- Main dish with ingredients and estimated portions
- Side dish
- Drink suggestion
- Estimated calories and key nutrients

### 🍽️ Dinner
- Main dish with ingredients and estimated portions
- Side dish
- Drink suggestion
- Estimated calories and key nutrients

### 🍎 Snack(s)
- 1-2 snack options with portions

### 💧 Hydration Target
- Daily water intake recommendation

### ⚠️ Safety Notes
- Any specific warnings related to medications or health conditions
- Foods to absolutely avoid today given the health data

### 📊 Daily Summary
- Estimated total calories
- Key nutritional highlights
- Health goal alignment

Be specific with quantities, avoid hated foods, favor loved foods when appropriate, and prioritize safety for the health conditions listed.`;
  }

  async generateMenu(firebaseUid: string, dto: GenerateMenuDto) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: { include: { medications: true } } },
    });

    if (!user) throw new NotFoundException('User not found');

    const recentLogs = await this.healthLogsService.findRecentLogs(user.id, 7);

    const date = dto.date ? dto.date : new Date().toISOString().split('T')[0];

    const prompt = this.buildMenuPrompt(
      user.profile as ProfileWithMedications | null,
      recentLogs,
      date,
      dto.additionalInstructions,
    );

    const menuText = await this.gemini.generateText(prompt);

    return {
      date,
      generatedAt: new Date().toISOString(),
      menu: menuText,
      healthFocus: user.profile?.healthFocus ?? [],
    };
  }
}
