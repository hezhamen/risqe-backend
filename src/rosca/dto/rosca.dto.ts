import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'Alpha Circle' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  totalFundTarget: number;
}

export class JoinGroupDto {
  @ApiProperty({ example: 'a18e50ce-3a60-44a9-8a13-fd546a3b5a55' })
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
