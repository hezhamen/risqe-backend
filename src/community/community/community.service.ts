import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from '../post.entity';
import { Comment } from '../comment.entity';
import { PostLike } from '../post-like.entity';
import { User } from '../../user/user.entity';
import {
  CreatePostDto,
  CreateCommentDto,
  UpdatePostDto,
} from '../dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<any> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = this.postRepository.create({
      userId,
      ...createPostDto,
    });

    const savedPost = await this.postRepository.save(post);

    // Return post with author information
    return {
      ...savedPost,
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photoUrl: user.photoUrl,
        creditScore: user.creditScore,
      },
    };
  }

  async updatePost(
    postId: string,
    userId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
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

    // Delete related records first to avoid foreign key constraint issues
    // Delete all likes for this post
    await this.postLikeRepository.delete({ postId });
    
    // Delete all comments for this post
    await this.commentRepository.delete({ postId });
    
    // Now delete the post
    await this.postRepository.remove(post);
  }

  async addComment(
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
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

  async getAllPosts(currentUserId?: string): Promise<any[]> {
    const posts = await this.postRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user', 'comments', 'comments.user'],
    });

    // Get all post IDs to check likes in batch
    const postIds = posts.map((post) => post.id);
    const userLikes = currentUserId && postIds.length > 0
      ? await this.postLikeRepository.find({
          where: { userId: currentUserId, postId: In(postIds) },
        })
      : [];
    const likedPostIds = new Set(userLikes.map((like) => like.postId));

    // Aggregate posts with author information and details
    return posts.map((post) => {
      // Sort comments by createdAt (oldest first)
      const sortedComments = [...post.comments].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      return {
        title: post.title,
        author: {
          id: post.user.id,
          avatar: post.user.photoUrl || null,
        },
        content: post.content,
        likeCount: post.likes,
        hasLiked: currentUserId ? likedPostIds.has(post.id) : false,
        commentCount: post.comments.length,
        comments: sortedComments.map((comment) => ({
          content: comment.content,
          author: {
            id: comment.user.id,
            firstName: comment.user.firstName,
            lastName: comment.user.lastName,
            email: comment.user.email,
            avatar: comment.user.photoUrl || null,
          },
        })),
      };
    });
  }

  async getPostWithDetails(postId: string, currentUserId?: string): Promise<any> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'comments', 'comments.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if current user has liked this post
    let hasLiked = false;
    if (currentUserId) {
      const like = await this.postLikeRepository.findOne({
        where: { postId, userId: currentUserId },
      });
      hasLiked = !!like;
    }

    // Sort comments by createdAt (oldest first)
    const sortedComments = [...post.comments].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Aggregate post and comments with author information
    const postWithAuthorInfo = {
      title: post.title,
      author: {
        id: post.user.id,
        avatar: post.user.photoUrl || null,
      },
      content: post.content,
      likeCount: post.likes,
      hasLiked,
      commentCount: post.comments.length,
      comments: sortedComments.map((comment) => ({
        content: comment.content,
        author: {
          id: comment.user.id,
          firstName: comment.user.firstName,
          lastName: comment.user.lastName,
          email: comment.user.email,
          avatar: comment.user.photoUrl || null,
        },
      })),
    };

    return postWithAuthorInfo;
  }

  async likePost(postId: string, userId: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked this post
    const existingLike = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (!existingLike) {
      // Create like record
      const like = this.postLikeRepository.create({ postId, userId });
      await this.postLikeRepository.save(like);

      // Increment likes count
      post.likes += 1;
      await this.postRepository.save(post);
    }

    return post;
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
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.likes += 1;
    return await this.commentRepository.save(comment);
  }

  async dislikeComment(commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
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
      author: {
        id: post.user.id,
        firstName: post.user.firstName,
        lastName: post.user.lastName,
        email: post.user.email,
        photoUrl: post.user.photoUrl,
        creditScore: post.user.creditScore,
      },
    };
  }
}
