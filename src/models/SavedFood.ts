import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedFood extends Document {
  user_id: string;
  food_name: string;
  serving_description: string;
  quantity: number;
  fatsecret_food_id?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: Date;
}

const SavedFoodSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  food_name: { type: String, required: true },
  serving_description: { type: String, required: true },
  quantity: { type: Number, required: true },
  fatsecret_food_id: { type: String },
  calories: { type: Number, required: true },
  protein_g: { type: Number, required: true },
  carbs_g: { type: Number, required: true },
  fat_g: { type: Number, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

SavedFoodSchema.index({ user_id: 1, created_at: -1 });

export const SavedFood = mongoose.models.SavedFood || mongoose.model<ISavedFood>('SavedFood', SavedFoodSchema);
