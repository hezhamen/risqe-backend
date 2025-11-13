import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import {
  CreatePostDto,
  CreateCommentDto,
  UpdatePostDto,
} from '../dto/community.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('posts')
  async createPost(
    @GetUser() user: any,
    @Body(ValidationPipe) createPostDto: CreatePostDto,
  ) {
    return this.communityService.createPost(user.id, createPostDto);
  }

  @Put('posts/:id')
  async updatePost(
    @Param('id') postId: string,
    @GetUser() user: any,
    @Body(ValidationPipe) updatePostDto: UpdatePostDto,
  ) {
    return this.communityService.updatePost(postId, user.id, updatePostDto);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') postId: string, @GetUser() user: any) {
    return this.communityService.deletePost(postId, user.id);
  }

  @Post('posts/:id/comments')
  async addComment(
    @Param('id') postId: string,
    @GetUser() user: any,
    @Body(ValidationPipe) createCommentDto: CreateCommentDto,
  ) {
    return this.communityService.addComment(postId, user.id, createCommentDto);
  }

  @Get('posts')
  async getAllPosts(@GetUser() user: any) {
    return this.communityService.getAllPosts(user.id);
  }

  @Get('posts/:id')
  async getPostWithDetails(
    @Param('id') postId: string,
    @GetUser() user: any,
  ) {
    return this.communityService.getPostWithDetails(postId, user.id);
  }

  @Post('posts/:id/like')
  async likePost(@Param('id') postId: string, @GetUser() user: any) {
    return this.communityService.likePost(postId, user.id);
  }

  @Post('posts/:id/dislike')
  async dislikePost(@Param('id') postId: string) {
    return this.communityService.dislikePost(postId);
  }

  @Post('comments/:id/like')
  async likeComment(@Param('id') commentId: string) {
    return this.communityService.likeComment(commentId);
  }

  @Post('comments/:id/dislike')
  async dislikeComment(@Param('id') commentId: string) {
    return this.communityService.dislikeComment(commentId);
  }
}
