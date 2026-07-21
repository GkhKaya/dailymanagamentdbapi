import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodCache extends Document {
  fatsecret_food_id: string;
  food_name: string;
  brand_name?: string;
  servings: {
    serving_id: string;
    description: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
  last_synced_at: Date;
}

const FoodCacheSchema: Schema = new Schema({
  fatsecret_food_id: { type: String, required: true, unique: true },
  food_name: { type: String, required: true },
  brand_name: { type: String, default: null },
  servings: [{
    serving_id: { type: String, required: true },
    description: { type: String, required: true },
    calories: { type: Number, required: true },
    protein_g: { type: Number, required: true },
    carbs_g: { type: Number, required: true },
    fat_g: { type: Number, required: true }
  }],
  last_synced_at: { type: Date, default: Date.now }
});

FoodCacheSchema.index({ food_name: 'text' });

export const FoodCache = mongoose.models.FoodCache || mongoose.model<IFoodCache>('FoodCache', FoodCacheSchema);
