import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PrivilegedUserService } from './privileged-user.service';
import { CreatePrivilegedUserDto } from './dto/create-privileged-user.dto';
import { UpdatePrivilegedUserDto } from './dto/update-privileged-user.dto';

@ApiTags('privileged-users')
@Controller('privileged-users')
export class PrivilegedUserController {
  constructor(private readonly privilegedUserService: PrivilegedUserService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur privilégié' })
  @ApiResponse({ status: 201, description: 'Utilisateur privilégié créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email déjà existant' })
  create(@Body() createPrivilegedUserDto: CreatePrivilegedUserDto) {
    return this.privilegedUserService.create(createPrivilegedUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les utilisateurs privilégiés' })
  @ApiQuery({ name: 'company', required: false, description: 'Filtrer par entreprise' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtrer par statut actif' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs privilégiés' })
  findAll(@Query('company') company?: string, @Query('active') active?: string) {
    if (company) {
      return this.privilegedUserService.findByCompany(company);
    }
    if (active === 'true') {
      return this.privilegedUserService.findActive();
    }
    return this.privilegedUserService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un utilisateur privilégié par ID' })
  @ApiResponse({ status: 200, description: 'Utilisateur privilégié trouvé' })
  @ApiResponse({ status: 404, description: 'Utilisateur privilégié non trouvé' })
  findOne(@Param('id') id: string) {
    return this.privilegedUserService.findOne(id);
  }

  @Get('by-email/:email')
  @ApiOperation({ summary: 'Vérifier si un email correspond à un utilisateur privilégié' })
  @ApiResponse({ status: 200, description: 'Résultat de la vérification' })
  checkPrivileged(@Param('email') email: string) {
    return this.privilegedUserService.isPrivilegedUser(email);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un utilisateur privilégié' })
  @ApiResponse({ status: 200, description: 'Utilisateur privilégié modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur privilégié non trouvé' })
  @ApiResponse({ status: 409, description: 'Email déjà existant' })
  update(@Param('id') id: string, @Body() updatePrivilegedUserDto: UpdatePrivilegedUserDto) {
    return this.privilegedUserService.update(id, updatePrivilegedUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur privilégié' })
  @ApiResponse({ status: 200, description: 'Utilisateur privilégié supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur privilégié non trouvé' })
  remove(@Param('id') id: string) {
    return this.privilegedUserService.remove(id);
  }
}
