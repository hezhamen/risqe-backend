import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Name of the ROSCA group',
    example: 'Alpha Circle',
    minLength: 1
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Total fund target amount for the ROSCA group',
    example: 1000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  totalFundTarget: number;
}

export class JoinGroupDto {
  @ApiProperty({
    description: 'Unique identifier of the ROSCA group to join',
    example: 'uuid-string'
  })
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
