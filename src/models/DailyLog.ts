import mongoose, { Schema, Document } from 'mongoose';
import { ExerciseSource } from './Enums';

export interface IFoodEntry {
  entry_id: mongoose.Types.ObjectId;
  fatsecret_food_id?: string;
  food_name: string;
  brand_name?: string;
  serving_description: string;
  quantity: number;
  nutrition_snapshot: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
  };
  added_at: Date;
}

export interface IDailyLog extends Document {
  user_id: string;
  date: Date;
  meals: {
    breakfast: IFoodEntry[];
    lunch: IFoodEntry[];
    dinner: IFoodEntry[];
    snack: IFoodEntry[];
  };
  sleep: {
    duration_minutes?: number;
    calories_burned?: number;
    quality?: string;
  };
  exercises: {
    entry_id: mongoose.Types.ObjectId;
    name: string;
    duration_minutes: number;
    calories_burned: number;
    source: ExerciseSource;
  }[];
  totals: {
    calories_consumed: number;
    calories_burned_exercise: number;
    calories_burned_sleep: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  created_at: Date;
  updated_at: Date;
}

const FoodEntrySchema = new Schema({
  entry_id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  fatsecret_food_id: { type: String },
  food_name: { type: String, required: true },
  brand_name: { type: String, default: null },
  serving_description: { type: String, required: true },
  quantity: { type: Number, required: true },
  nutrition_snapshot: {
    calories: { type: Number, required: true },
    protein_g: { type: Number, required: true },
    carbs_g: { type: Number, required: true },
    fat_g: { type: Number, required: true },
    fiber_g: { type: Number },
    sugar_g: { type: Number },
    sodium_mg: { type: Number }
  },
  added_at: { type: Date, default: Date.now }
}, { _id: false });

const DailyLogSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  date: { type: Date, required: true },
  meals: {
    breakfast: [FoodEntrySchema],
    lunch: [FoodEntrySchema],
    dinner: [FoodEntrySchema],
    snack: [FoodEntrySchema]
  },
  sleep: {
    duration_minutes: { type: Number, default: null },
    calories_burned: { type: Number, default: 0 },
    quality: { type: String, default: null }
  },
  exercises: [{
    _id: false,
    entry_id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    name: { type: String, required: true },
    duration_minutes: { type: Number, required: true },
    calories_burned: { type: Number, required: true },
    source: { type: String, enum: Object.values(ExerciseSource), required: true }
  }],
  totals: {
    calories_consumed: { type: Number, default: 0 },
    calories_burned_exercise: { type: Number, default: 0 },
    calories_burned_sleep: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carbs_g: { type: Number, default: 0 },
    fat_g: { type: Number, default: 0 }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

DailyLogSchema.pre('validate', function() {
  const doc = this as unknown as IDailyLog;
  if (doc.date) {
    doc.date.setUTCHours(0, 0, 0, 0);
  }
});

DailyLogSchema.index({ user_id: 1, date: 1 }, { unique: true });

export const DailyLog = mongoose.models.DailyLog || mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);
