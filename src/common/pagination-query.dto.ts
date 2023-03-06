import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Min(0)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset: number;
}
