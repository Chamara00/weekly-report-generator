import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssistantModule } from './assistant/assistant.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { ReviewModule } from './review/review.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Loads .env once and makes ConfigService injectable everywhere.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ReportsModule,
    ReviewModule,
    DashboardModule,
    ProjectsModule,
    AssistantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ORDER MATTERS. Nest executes global guards in the order declared here:
    // authenticate first (populates request.user), then authorise by role.
    // Swapping these would make RolesGuard read an undefined user.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
