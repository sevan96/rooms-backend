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
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { LockRoomDto } from './dto/lock-room.dto';
import { UnlockRoomDto } from './dto/unlock-room.dto';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer une nouvelle salle',
    description: 'Crée une nouvelle salle avec génération automatique d\'un code d\'accès à 6 chiffres'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Salle créée avec succès (code d\'accès généré automatiquement)' 
  })
  @ApiResponse({ status: 409, description: 'Impossible de générer un code d\'accès unique' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les salles' })
  @ApiQuery({ name: 'company', required: false, description: 'Filtrer par entreprise' })
  @ApiQuery({ name: 'available', required: false, description: 'Filtrer par disponibilité' })
  @ApiResponse({ status: 200, description: 'Liste des salles' })
  findAll(@Query('company') company?: string, @Query('available') available?: string) {
    if (company) {
      return this.roomService.findByCompany(company);
    }
    if (available === 'true') {
      return this.roomService.findAvailable();
    }
    return this.roomService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une salle par ID' })
  @ApiResponse({ status: 200, description: 'Salle trouvée' })
  @ApiResponse({ status: 404, description: 'Salle non trouvée' })
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  @Get('by-access-code/:accessCode')
  @ApiOperation({ summary: 'Obtenir une salle par code d\'accès' })
  @ApiResponse({ status: 200, description: 'Salle trouvée' })
  @ApiResponse({ status: 404, description: 'Salle non trouvée' })
  findByAccessCode(@Param('accessCode') accessCode: string) {
    return this.roomService.findByAccessCode(accessCode);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une salle' })
  @ApiResponse({ status: 200, description: 'Salle modifiée avec succès' })
  @ApiResponse({ status: 404, description: 'Salle non trouvée' })
  @ApiResponse({ status: 409, description: 'Code d\'accès déjà existant' })
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une salle' })
  @ApiResponse({ status: 200, description: 'Salle supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Salle non trouvée' })
  remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }

  @Post('lock')
  @ApiOperation({ 
    summary: 'Verrouiller une salle',
    description: 'Verrouille une salle avec son code d\'accès. Une salle verrouillée est considérée comme configurée et associée à une tablette.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Salle verrouillée avec succès' 
  })
  @ApiResponse({ status: 404, description: 'Aucune salle trouvée avec ce code d\'accès' })
  @ApiResponse({ status: 400, description: 'Cette salle est déjà verrouillée' })
  lockRoom(@Body() lockRoomDto: LockRoomDto) {
    return this.roomService.lockRoom(lockRoomDto);
  }

  @Post('unlock')
  @ApiOperation({ 
    summary: 'Déverrouiller une salle',
    description: 'Déverrouille une salle avec son code d\'accès. Cela dissocie la salle de sa tablette.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Salle déverrouillée avec succès' 
  })
  @ApiResponse({ status: 404, description: 'Aucune salle trouvée avec ce code d\'accès' })
  @ApiResponse({ status: 400, description: 'Cette salle n\'est pas verrouillée' })
  unlockRoom(@Body() unlockRoomDto: UnlockRoomDto) {
    return this.roomService.unlockRoom(unlockRoomDto);
  }

  @Get('check-lock/:accessCode')
  @ApiOperation({ 
    summary: 'Vérifier le statut de verrouillage',
    description: 'Vérifie si une salle est verrouillée ou non grâce à son code d\'accès'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut de verrouillage récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        locked: { type: 'boolean', description: 'Statut de verrouillage de la salle' },
        room: { type: 'object', description: 'Informations de la salle' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Aucune salle trouvée avec ce code d\'accès' })
  checkLockStatus(@Param('accessCode') accessCode: string) {
    return this.roomService.checkLockStatus(accessCode);
  }
}
