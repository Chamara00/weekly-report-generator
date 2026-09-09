import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ReviewModule } from '../review/review.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantTools } from './assistant.tools';

/**
 * Imports the modules whose services back the tools, rather than reaching for
 * Prisma: the assistant answers from the same code paths the dashboard and the
 * review queue use, so the two can never disagree.
 */
@Module({
  imports: [DashboardModule, ReviewModule],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantTools],
})
export class AssistantModule {}
