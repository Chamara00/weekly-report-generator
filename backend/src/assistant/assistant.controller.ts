import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AssistantService } from './assistant.service';
import { ChatRequestDto } from './dto/chat.dto';

/**
 * Manager-only AI assistant.
 *
 * @Roles(Role.MANAGER) is not a convenience here, it is the privacy boundary:
 * the assistant can read any team member's report content through its tools, so
 * exposing it to a team member would hand them exactly the data the rest of the
 * app spends its guards keeping private.
 */
@ApiTags('assistant')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Team members cannot use the assistant' })
@Roles(Role.MANAGER)
@Controller('manager/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Whether the assistant has an API key configured',
    description:
      'Lets the UI hide the widget instead of offering a feature that 503s.',
  })
  status() {
    return { configured: this.assistantService.isConfigured };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask a question about the team',
    description:
      'Gemini answers using function calls into the existing dashboard and ' +
      'review services. Returns the answer plus which tools were used.',
  })
  @ApiServiceUnavailableResponse({ description: 'GEMINI_API_KEY is not set' })
  chat(@Body() dto: ChatRequestDto, @CurrentUser() manager: AuthenticatedUser) {
    return this.assistantService.chat(dto, manager);
  }
}
