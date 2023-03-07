import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) { }

  @Post()
  @UseGuards(UserGuard)
  createStory(@UserJwt() userAuth: UserAuth, @Body() createStoryDto: CreateStoryDto) {
    return this.storyService.createStory(userAuth.userId, createStoryDto);
  }

  @Delete(':id')
  @UseGuards(UserGuard)
  deleteStory(@UserJwt() userAuth: UserAuth, @Param('id') storyId: string){
    return this.storyService.deleteStory(userAuth.userId, storyId);
  }

  @Get()
  @UseGuards(UserGuard)
  getStories(@UserJwt() userAuth: UserAuth, @Query() paginationQueryDto: PaginationQueryDto){
    return this.storyService.getStoreis(userAuth.userId, paginationQueryDto);
  }

  @Post('view')
  @UseGuards(UserGuard)
  viewStory(@UserJwt() userAuth: UserAuth, @Body("storyId") storyId: string) {
    return this.storyService.viewStory(userAuth.userId, storyId);
  }

}
