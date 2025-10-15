import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My first post' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Hello community!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated content' })
  @IsString()
  content?: string;
}
