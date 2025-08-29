import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ description: 'Nom de la salle' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description de la salle' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ description: 'Entreprise propriétaire de la salle' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiPropertyOptional({
    description: 'Disponibilité de la salle',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  available?: boolean;
}
