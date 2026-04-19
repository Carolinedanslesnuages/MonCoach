import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import { HealthLogsService } from '../health-logs/health-logs.service';
import { MealsService } from '../meals/meals.service';
import { HealthLog, Meal, Medication, Profile } from '@prisma/client';

type ProfileWithMedications = Profile & { medications: Medication[] };

export interface AuditReport {
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  healthFocus: string[];
  report: string;
  stats: {
    totalHealthLogs: number;
    totalMeals: number;
    avgBloodPressureSystolic: number | null;
    avgBloodPressureDiastolic: number | null;
    avgWeight: number | null;
    avgGlycemia: number | null;
    periodStartEvents: number;
    edemaEvents: number;
  };
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly healthLogsService: HealthLogsService,
    private readonly mealsService: MealsService,
  ) {}

  private average(values: (number | null | undefined)[]): number | null {
    const nums = values.filter((v): v is number => v != null);
    if (nums.length === 0) return null;
    return (
      Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
    );
  }

  private computeStats(logs: HealthLog[], meals: Meal[]) {
    return {
      totalHealthLogs: logs.length,
      totalMeals: meals.length,
      avgBloodPressureSystolic: this.average(logs.map((l) => l.systolic)),
      avgBloodPressureDiastolic: this.average(logs.map((l) => l.diastolic)),
      avgWeight: this.average(logs.map((l) => l.weightKg)),
      avgGlycemia: this.average(logs.map((l) => l.glycemia)),
      periodStartEvents: logs.filter((l) => l.isPeriodStart).length,
      edemaEvents: logs.filter((l) => l.hasEdema).length,
    };
  }

  private buildAuditPrompt(
    profile: ProfileWithMedications | null,
    logs: HealthLog[],
    meals: Meal[],
    periodStart: string,
    periodEnd: string,
  ): string {
    const focus = profile?.healthFocus?.join(', ') || 'general health';
    const meds =
      profile?.medications
        ?.map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`)
        .join(', ') || 'none';

    const healthLogsSummary =
      logs.length > 0
        ? logs
            .map((l) => {
              const parts: string[] = [l.loggedAt.toISOString().split('T')[0]];
              if (l.systolic && l.diastolic)
                parts.push(`BP ${l.systolic}/${l.diastolic}`);
              if (l.weightKg) parts.push(`W ${l.weightKg}kg`);
              if (l.glycemia) parts.push(`Gly ${l.glycemia}`);
              if (l.hba1c) parts.push(`HbA1c ${l.hba1c}%`);
              if (l.ldl) parts.push(`LDL ${l.ldl}`);
              if (l.crp) parts.push(`CRP ${l.crp}`);
              if (l.ferritin) parts.push(`Fer ${l.ferritin}`);
              if (l.tsh) parts.push(`TSH ${l.tsh}`);
              if (l.hydrationLiters) parts.push(`H₂O ${l.hydrationLiters}L`);
              if (l.hasEdema) parts.push('EDEMA');
              if (l.isPeriodStart) parts.push('PERIOD_START');
              if (l.medicationsTaken?.length)
                parts.push(`Meds: ${l.medicationsTaken.join(', ')}`);
              if (l.notes) parts.push(`Note: ${l.notes}`);
              return parts.join(' | ');
            })
            .join('\n')
        : 'No health logs recorded during this period.';

    const mealsSummary =
      meals.length > 0
        ? meals
            .map(
              (m) =>
                `${m.loggedAt.toISOString().split('T')[0]} [${m.mealType ?? 'meal'}]: ${m.description}`,
            )
            .join('\n')
        : 'No meals recorded during this period.';

    return `You are a personalized health coach performing a 15-day audit for a patient. Analyze the data thoroughly and provide actionable insights.

## Patient Profile
- Health focus: ${focus}
- Medical context: ${profile?.medicalContext ?? 'not specified'}
- Height: ${profile?.heightCm ? `${profile.heightCm} cm` : 'not specified'}
- Current medications: ${meds}

## Audit Period
From: ${periodStart}
To: ${periodEnd}

## Health Logs (${logs.length} entries)
${healthLogsSummary}

## Meal Journal (${meals.length} entries)
${mealsSummary}

## Audit Report Requirements

Please generate a comprehensive 15-day health audit with the following sections:

### 📈 Executive Summary
- Overall health trajectory (improving/stable/concerning)
- Key achievements and areas of concern

### 🫀 Cardiovascular Health
- Blood pressure trend analysis (if data available)
- Relevant observations

### ⚖️ Weight & Metabolic
- Weight trend
- Glycemia/HbA1c trends (if available)
- LDL/cholesterol observations

### 🧪 Biomarkers Review
- CRP inflammation trends
- Ferritin levels
- TSH thyroid function
- Any abnormal values to discuss with doctor

### 🍽️ Nutrition Analysis
- Dietary patterns and habits
- Nutritional gaps identified
- Positive food choices
- Foods to increase/reduce

### 💊 Medication Adherence
- Observed adherence based on logs
- Any concerning patterns

### 💧 Lifestyle Factors
- Hydration trends
- Edema episodes
- Cycle observations (if relevant)

### 🎯 Personalized Recommendations
1. Top 3 immediate actions for the next 15 days
2. Dietary adjustments specific to health focus (${focus})
3. When to consult a healthcare provider (red flags if any)
4. Positive reinforcement: what's working well

### ⚠️ Medical Disclaimer
Include a brief disclaimer that this is AI-generated health coaching, not medical advice.

Be specific, data-driven, empathetic, and actionable. Reference actual values from the data where possible.`;
  }

  async generateAudit(firebaseUid: string): Promise<AuditReport> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: { include: { medications: true } } },
    });

    if (!user) throw new NotFoundException('User not found');

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 15);

    const [logs, meals] = await Promise.all([
      this.healthLogsService.findRecentLogs(user.id, 15),
      this.mealsService.findRecentMeals(user.id, 15),
    ]);

    const stats = this.computeStats(logs, meals);

    const prompt = this.buildAuditPrompt(
      user.profile as ProfileWithMedications | null,
      logs,
      meals,
      periodStart.toISOString().split('T')[0],
      periodEnd.toISOString().split('T')[0],
    );

    const report = await this.gemini.generateText(prompt);

    return {
      generatedAt: new Date().toISOString(),
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      healthFocus: user.profile?.healthFocus ?? [],
      report,
      stats,
    };
  }

  async exportAudit(
    firebaseUid: string,
  ): Promise<{ filename: string; content: string; contentType: string }> {
    const auditReport = await this.generateAudit(firebaseUid);

    const content = `# MonCoach Health Audit Report
Generated: ${auditReport.generatedAt}
Period: ${auditReport.periodStart} to ${auditReport.periodEnd}
Health Focus: ${auditReport.healthFocus.join(', ')}

## Statistics
- Total Health Logs: ${auditReport.stats.totalHealthLogs}
- Total Meals Logged: ${auditReport.stats.totalMeals}
- Avg Systolic BP: ${auditReport.stats.avgBloodPressureSystolic ?? 'N/A'}
- Avg Diastolic BP: ${auditReport.stats.avgBloodPressureDiastolic ?? 'N/A'}
- Avg Weight: ${auditReport.stats.avgWeight ? `${auditReport.stats.avgWeight} kg` : 'N/A'}
- Avg Glycemia: ${auditReport.stats.avgGlycemia ?? 'N/A'}
- Period Start Events: ${auditReport.stats.periodStartEvents}
- Edema Episodes: ${auditReport.stats.edemaEvents}

---

${auditReport.report}

---
*This report was generated by MonCoach AI and does not constitute medical advice.*
`;

    return {
      filename: `audit-${auditReport.periodStart}-to-${auditReport.periodEnd}.md`,
      content,
      contentType: 'text/markdown',
    };
  }
}
