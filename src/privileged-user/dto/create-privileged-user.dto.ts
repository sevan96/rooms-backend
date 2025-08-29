import { IsString, IsNotEmpty, IsEmail, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrivilegedUserDto {
  @ApiProperty({ description: 'Nom complet de l\'utilisateur' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ description: 'Adresse email unique de l\'utilisateur' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Entreprise de l\'utilisateur' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiPropertyOptional({ description: 'Statut actif de l\'utilisateur', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
