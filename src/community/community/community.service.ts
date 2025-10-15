import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../post.entity';
import { Comment } from '../comment.entity';
import { User } from '../../user/user.entity';
import { CreatePostDto, CreateCommentDto, UpdatePostDto } from '../dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = this.postRepository.create({
      userId,
      ...createPostDto,
    });

    return await this.postRepository.save(post);
  }

  async updatePost(postId: string, userId: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new NotFoundException('You can only edit your own posts');
    }

    const updatedPost = await this.postRepository.save({
      ...post,
      ...updatePostDto,
    });

    return this.getPostWithAuthorCreditScore(updatedPost.id);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new NotFoundException('You can only delete your own posts');
    }

    await this.postRepository.remove(post);
  }

  async addComment(postId: string, userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    // Verify post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comment = this.commentRepository.create({
      postId,
      userId,
      ...createCommentDto,
    });

    return await this.commentRepository.save(comment);
  }

  async getAllPosts(): Promise<any[]> {
    const posts = await this.postRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    // Aggregate posts with author credit scores
    return posts.map(post => ({
      ...post,
      authorCreditScore: post.user.creditScore,
    }));
  }

  async getPostWithDetails(postId: string): Promise<any> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'comments', 'comments.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Aggregate post and comments with credit scores
    const postWithCreditScores = {
      ...post,
      authorCreditScore: post.user.creditScore,
      comments: post.comments.map(comment => ({
        ...comment,
        authorCreditScore: comment.user.creditScore,
      })),
    };

    return postWithCreditScores;
  }

  async likePost(postId: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.likes += 1;
    return await this.postRepository.save(post);
  }

  async dislikePost(postId: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.dislikes += 1;
    return await this.postRepository.save(post);
  }

  async likeComment(commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.likes += 1;
    return await this.commentRepository.save(comment);
  }

  async dislikeComment(commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.dislikes += 1;
    return await this.commentRepository.save(comment);
  }

  private async getPostWithAuthorCreditScore(postId: string): Promise<any> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      ...post,
      authorCreditScore: post.user.creditScore,
    };
  }
}
