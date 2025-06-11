import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Gaming Keyboard' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Mechanical RGB keyboard with blue switches' })
  @IsString()
  description: string;

  @ApiProperty({ example: 89.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;
}
