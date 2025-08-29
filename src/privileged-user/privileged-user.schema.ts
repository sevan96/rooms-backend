import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PrivilegedUser extends Document {
  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  company: string;

  @Prop({ default: true })
  is_active: boolean;
}

export const PrivilegedUserSchema = SchemaFactory.createForClass(PrivilegedUser);
