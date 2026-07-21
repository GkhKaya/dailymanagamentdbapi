import mongoose, { Schema, Document } from 'mongoose';
import { SubscriptionFrequency } from './Enums';

export interface ISubscription extends Document {
  user_id: string;
  name: string;
  amount: mongoose.Types.Decimal128;
  category_id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  frequency: SubscriptionFrequency;
  billing_day: number;
  next_run_date: Date;
  is_active: boolean;
  created_at: Date;
}

const SubscriptionSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  name: { type: String, required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  frequency: { type: String, enum: Object.values(SubscriptionFrequency), required: true },
  billing_day: { type: Number, required: true, min: 1, max: 31 },
  next_run_date: { type: Date, required: true },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

SubscriptionSchema.index({ is_active: 1, next_run_date: 1 });

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
