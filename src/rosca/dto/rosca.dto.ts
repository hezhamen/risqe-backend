import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  IsOptional,
  IsArray,
  IsEnum,
  IsEmail,
  ValidateNested,
  MinLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupMemberDto {
  @ApiProperty({
    description: 'Unique identifier of the user to add as a member',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

export class CreateGroupDto {
  @ApiProperty({
    description: 'Name of the ROSCA group',
    example: 'Peshkawtn',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Total fund target amount for the ROSCA group',
    example: 840000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalFundTarget: number;

  @ApiProperty({
    description: 'Duration of the group (e.g., "1 year", "6 months")',
    example: '1 year',
  })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({
    description: 'Frequency of payouts (e.g., "month", "week", "day")',
    example: 'month',
  })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({
    description: 'Type of payout distribution',
    enum: ['ORDERED_LIST', 'VOTE_BASED'],
    example: 'ORDERED_LIST',
  })
  @IsEnum(['ORDERED_LIST', 'VOTE_BASED'])
  @IsNotEmpty()
  payoutType: 'ORDERED_LIST' | 'VOTE_BASED';

  @ApiProperty({
    description: 'List of members to add to the group',
    type: [CreateGroupMemberDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGroupMemberDto)
  @IsNotEmpty()
  members: CreateGroupMemberDto[];

  @ApiProperty({
    description:
      'Ordered list of user IDs for payout order. Required for ORDERED_LIST payout type. Should match the userIds in the members array (excluding creator).',
    type: [String],
    required: false,
    example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  memberOrder?: string[];
}

export class JoinGroupDto {
  @ApiProperty({
    description: 'Unique identifier of the ROSCA group to join',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  groupId: string;
}

export class VoteOnPayoutDto {
  @ApiProperty({
    description: 'ID of the member to vote for',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({
    description: 'Type of vote',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject'])
  @IsNotEmpty()
  voteType: 'approve' | 'reject';
}

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the member to invite',
    example: 'newmember@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
