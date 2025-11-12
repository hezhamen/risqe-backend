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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupMemberDto {
  @ApiProperty({
    description: 'Email address of the member',
    example: 'member@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Name of the member',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
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
    description: 'Ordered list of member IDs for payout order (for ordered list payout type)',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
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
