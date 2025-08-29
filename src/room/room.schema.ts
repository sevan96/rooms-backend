import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Room extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true, unique: true })
  access_code: string;

  @Prop({ required: true })
  company: string;

  @Prop({ default: true })
  available: boolean;

  @Prop({ default: false })
  locked: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
