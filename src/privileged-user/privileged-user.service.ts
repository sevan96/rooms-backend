import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrivilegedUser } from './privileged-user.schema';
import { CreatePrivilegedUserDto } from './dto/create-privileged-user.dto';
import { UpdatePrivilegedUserDto } from './dto/update-privileged-user.dto';

@Injectable()
export class PrivilegedUserService {
  constructor(
    @InjectModel(PrivilegedUser.name) 
    private privilegedUserModel: Model<PrivilegedUser>
  ) {}

  async create(createPrivilegedUserDto: CreatePrivilegedUserDto): Promise<PrivilegedUser> {
    try {
      const user = new this.privilegedUserModel(createPrivilegedUserDto);
      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Cet email existe déjà');
      }
      throw error;
    }
  }

  async findAll(): Promise<PrivilegedUser[]> {
    return this.privilegedUserModel.find().exec();
  }

  async findOne(id: string): Promise<PrivilegedUser> {
    const user = await this.privilegedUserModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Utilisateur privilégié non trouvé');
    }
    return user;
  }

  async findByEmail(email: string): Promise<PrivilegedUser | null> {
    return this.privilegedUserModel.findOne({ email, is_active: true }).exec();
  }

  async findByCompany(company: string): Promise<PrivilegedUser[]> {
    return this.privilegedUserModel.find({ company, is_active: true }).exec();
  }

  async findActive(): Promise<PrivilegedUser[]> {
    return this.privilegedUserModel.find({ is_active: true }).exec();
  }

  async isPrivilegedUser(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }

  async update(id: string, updatePrivilegedUserDto: UpdatePrivilegedUserDto): Promise<PrivilegedUser> {
    try {
      const user = await this.privilegedUserModel
        .findByIdAndUpdate(id, updatePrivilegedUserDto, { new: true })
        .exec();
      
      if (!user) {
        throw new NotFoundException('Utilisateur privilégié non trouvé');
      }
      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Cet email existe déjà');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.privilegedUserModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Utilisateur privilégié non trouvé');
    }
  }
}
