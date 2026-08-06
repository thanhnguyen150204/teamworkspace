import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}


  @Get('me')
  getMyActivity(@CurrentUser('id') userId: number) {
    return this.activityService.getUserActivity(userId);
  }

  @Get('workspace/:workspaceId')
  getWorkspaceActivity(@Param('workspaceId', ParseIntPipe) workspaceId: number, @CurrentUser('id') userId: number) {
    return this.activityService.getWorkspaceActivity(workspaceId, userId);
  }
}