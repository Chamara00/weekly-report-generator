import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  InviteUserDto,
  QueryUsersDto,
  SetActiveDto,
  UpdateRoleDto,
} from './dto/user-admin.dto';
import { UsersService } from './users.service';

/**
 * User administration. @Roles(Role.MANAGER) on the class covers every route.
 *
 * This controller is where §1's "role assignment" lives: public registration
 * deliberately cannot set a role, so the only path to MANAGER is an existing
 * manager granting it here.
 *
 * The acting manager's id is passed into the service on every mutating call so
 * the service can refuse self-demotion, self-deactivation and self-deletion --
 * rules that belong next to the data, not in the UI.
 */
@ApiTags('users')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Managers only' })
@Roles(Role.MANAGER)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users',
    description:
      'Paginated, filterable by role and status, searchable by name or email.',
  })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Invite a team member or manager',
    description:
      'Creates the account and returns a one-time temporary password for the ' +
      'manager to pass on. There is no mail service in this project.',
  })
  @ApiConflictResponse({ description: 'Email already registered' })
  invite(@Body() dto: InviteUserDto) {
    return this.usersService.invite(dto);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Assign a role' })
  @ApiBadRequestResponse({ description: 'You cannot change your own role' })
  @ApiConflictResponse({
    description: 'That would remove the last active manager',
  })
  @ApiNotFoundResponse({ description: 'No such user' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() manager: AuthenticatedUser,
  ) {
    return this.usersService.updateRole(id, dto, manager.id);
  }

  @Patch(':id/active')
  @ApiOperation({
    summary: 'Deactivate or restore an account',
    description:
      'Deactivating blocks login immediately (existing tokens stop working too) ' +
      'while keeping every report the person filed.',
  })
  @ApiBadRequestResponse({
    description: 'You cannot deactivate your own account',
  })
  setActive(
    @Param('id') id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() manager: AuthenticatedUser,
  ) {
    return this.usersService.setActive(id, dto, manager.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Permanently delete a user',
    description:
      'Refused when the user has filed reports — those cascade — so anyone with ' +
      'history is deactivated instead.',
  })
  @ApiConflictResponse({
    description: 'The user has reports, or is the last manager',
  })
  remove(@Param('id') id: string, @CurrentUser() manager: AuthenticatedUser) {
    return this.usersService.remove(id, manager.id);
  }
}
