import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CancelMeetingDto {
  @ApiProperty({ description: 'Raison de l\'annulation' })
  @IsString()
  @IsNotEmpty()
  cancelled_reason: string;

  @ApiPropertyOptional({ description: 'Personne qui annule la réunion' })
  @IsString()
  @IsOptional()
  cancelled_by?: string;
}
