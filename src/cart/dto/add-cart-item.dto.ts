import { IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @IsInt()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
