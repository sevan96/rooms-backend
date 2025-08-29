import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelByAccessCodeDto {
  @ApiProperty({ 
    description: 'Code d\'accès de la réunion',
    example: 'ABC123DEF456'
  })
  @IsString()
  @IsNotEmpty()
  access_code: string;

  @ApiProperty({ description: 'Raison de l\'annulation' })
  @IsString()
  @IsNotEmpty()
  cancelled_reason: string;

  @ApiProperty({ 
    description: 'Personne qui annule la réunion', 
    required: false,
    example: 'Jean Dupont'
  })
  @IsString()
  cancelled_by?: string;
}
