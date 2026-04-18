import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GeminiModule } from './gemini/gemini.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthLogsModule } from './health-logs/health-logs.module';
import { MealsModule } from './meals/meals.module';
import { MenusModule } from './menus/menus.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GeminiModule,
    AuthModule,
    UsersModule,
    HealthLogsModule,
    MealsModule,
    MenusModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        if (!admin.apps.length) {
          const projectId = process.env.FIREBASE_PROJECT_ID;
          const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
          const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
            /\\n/g,
            '\n',
          );

          if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
              }),
            });
          } else {
            // Initialise with applicationDefault for environments like Cloud Run
            admin.initializeApp();
          }
        }
        return admin;
      },
    },
  ],
})
export class AppModule {}
