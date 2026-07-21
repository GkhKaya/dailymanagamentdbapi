import mongoose, { Schema, Document } from 'mongoose';
import { Gender, ActivityLevel, BmrFormula } from './Enums';

export interface IUser extends Document {
  username?: string;
  email: string;
  password_hash?: string;
  profile: {
    name: string;
    birth_date?: Date;
    gender?: Gender;
    height_cm?: number;
    activity_level?: ActivityLevel;
    bmr_formula?: BmrFormula;
  };
  current_weight_kg?: number;
  target_weight_kg?: number;
  settings: {
    daily_calorie_goal?: number;
    currency: string;
    timezone?: string;
  };
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String },
  profile: {
    name: { type: String, required: true },
    birth_date: { type: Date },
    gender: { type: String, enum: Object.values(Gender) },
    height_cm: { type: Number },
    activity_level: { type: String, enum: Object.values(ActivityLevel) },
    bmr_formula: { type: String, enum: Object.values(BmrFormula) }
  },
  current_weight_kg: { type: Number },
  target_weight_kg: { type: Number },
  settings: {
    daily_calorie_goal: { type: Number, default: null },
    currency: { type: String, default: 'TRY' },
    timezone: { type: String }
  }
}, {
  collection: 'user',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
