import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { LockRoomDto } from './dto/lock-room.dto';
import { UnlockRoomDto } from './dto/unlock-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<Room>,
  ) {}

  /**
   * Génère un code d'accès aléatoire de 6 chiffres
   */
  private generateAccessCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Vérifie si un code d'accès existe déjà
   */
  private async isAccessCodeExists(accessCode: string): Promise<boolean> {
    const existingRoom = await this.roomModel
      .findOne({ access_code: accessCode })
      .exec();
    return !!existingRoom;
  }

  /**
   * Génère un code d'accès unique (non utilisé)
   */
  private async generateUniqueAccessCode(): Promise<string> {
    let accessCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      accessCode = this.generateAccessCode();
      attempts++;

      if (attempts > maxAttempts) {
        throw new ConflictException(
          "Impossible de générer un code d'accès unique",
        );
      }
    } while (await this.isAccessCodeExists(accessCode));

    return accessCode;
  }

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    try {
      // Générer un code d'accès unique
      const access_code = await this.generateUniqueAccessCode();

      // Créer la salle avec le code d'accès généré
      const room = new this.roomModel({
        ...createRoomDto,
        access_code,
      });

      return await room.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException("Le code d'accès existe déjà");
      }
      throw error;
    }
  }

  async findAll(): Promise<Room[]> {
    return this.roomModel.find().exec();
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Salle non trouvée');
    }
    return room;
  }

  async findByAccessCode(accessCode: string): Promise<Room> {
    const room = await this.roomModel
      .findOne({ access_code: accessCode })
      .exec();
    if (!room) {
      throw new NotFoundException('Salle non trouvée');
    }
    return room;
  }

  async findByCompany(company: string): Promise<Room[]> {
    return this.roomModel.find({ company }).exec();
  }

  async findAvailable(): Promise<Room[]> {
    return this.roomModel.find({ available: true }).exec();
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    try {
      const room = await this.roomModel
        .findByIdAndUpdate(id, updateRoomDto, { new: true })
        .exec();

      if (!room) {
        throw new NotFoundException('Salle non trouvée');
      }
      return room;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException("Le code d'accès existe déjà");
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.roomModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Salle non trouvée');
    }
  }

  /**
   * Verrouille une salle avec le code d'accès
   * Une salle verrouillée ne peut plus être verrouillée à nouveau
   */
  async lockRoom(lockRoomDto: LockRoomDto): Promise<Room> {
    const { access_code } = lockRoomDto;

    // Trouver la salle par son code d'accès
    const room = await this.roomModel.findOne({ access_code }).exec();

    if (!room) {
      throw new NotFoundException("Aucune salle trouvée avec ce code d'accès");
    }

    // Vérifier si la salle est déjà verrouillée
    if (room.locked) {
      throw new BadRequestException(
        'Cette salle est déjà verrouillée et associée à une tablette',
      );
    }

    // Verrouiller la salle
    room.locked = true;
    return await room.save();
  }

  /**
   * Déverrouille une salle avec le code d'accès
   */
  async unlockRoom(unlockRoomDto: UnlockRoomDto): Promise<Room> {
    const { access_code } = unlockRoomDto;

    // Trouver la salle par son code d'accès
    const room = await this.roomModel.findOne({ access_code }).exec();

    if (!room) {
      throw new NotFoundException("Aucune salle trouvée avec ce code d'accès");
    }

    // Vérifier si la salle est effectivement verrouillée
    if (!room.locked) {
      throw new BadRequestException("Cette salle n'est pas verrouillée");
    }

    // Déverrouiller la salle
    room.locked = false;
    return await room.save();
  }

  /**
   * Vérifier le statut de verrouillage d'une salle par son code d'accès
   */
  async checkLockStatus(
    accessCode: string,
  ): Promise<{ locked: boolean; room: Room }> {
    const room = await this.roomModel
      .findOne({ access_code: accessCode })
      .exec();

    if (!room) {
      throw new NotFoundException("Aucune salle trouvée avec ce code d'accès");
    }

    return {
      locked: room.locked,
      room: room,
    };
  }
}
