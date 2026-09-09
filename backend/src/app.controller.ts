import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Unauthenticated liveness check.
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness check' })
  health() {
    return this.appService.getHealth();
  }
}
