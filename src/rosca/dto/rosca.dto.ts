import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  totalFundTarget: number;
}

export class JoinGroupDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
