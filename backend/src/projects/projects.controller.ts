import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateProjectDto,
  ProjectMemberDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

// Reads are open to any authenticated user.
@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects (any authenticated user)' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'One project with its assigned members' })
  @ApiNotFoundResponse({ description: 'No such project' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Create a project' })
  @ApiConflictResponse({
    description: 'A project with that name already exists',
  })
  @ApiForbiddenResponse({ description: 'Managers only' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Rename or re-describe a project' })
  @ApiConflictResponse({
    description: 'A project with that name already exists',
  })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @ApiOperation({
    summary: 'Delete a project',
    description:
      'Refused with 409 when reports are filed against it: reports are the ' +
      'historical record of work done and are never cascade-deleted.',
  })
  @ApiConflictResponse({ description: 'The project still has reports' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/members')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Assign a user to a project' })
  @ApiConflictResponse({ description: 'Already assigned' })
  addMember(@Param('id') id: string, @Body() dto: ProjectMemberDto) {
    return this.projectsService.addMember(id, dto);
  }

  @Delete(':id/members/:userId')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Unassign a user from a project' })
  @ApiNotFoundResponse({
    description: 'That user is not assigned to this project',
  })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }
}
