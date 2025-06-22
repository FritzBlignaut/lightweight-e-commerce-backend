// dto/admin-order-query.dto.ts
import { IsOptional, IsNumberString, IsString, IsDateString } from 'class-validator';

export class AdminOrderQueryDto {
  @IsOptional() @IsNumberString() page?: string;
  @IsOptional() @IsNumberString() limit?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsNumberString() minTotal?: string;
  @IsOptional() @IsNumberString() maxTotal?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
