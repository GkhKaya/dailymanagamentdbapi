import mongoose, { Schema, Document } from 'mongoose';
import { TransactionType, TransactionSource } from './Enums';

export interface ITransaction extends Document {
  user_id: string;
  type: TransactionType;
  amount: mongoose.Types.Decimal128;
  date: Date;
  description: string;
  category_id?: mongoose.Types.ObjectId | null;
  account_id: mongoose.Types.ObjectId;
  related_account_id?: mongoose.Types.ObjectId | null;
  is_external_payment: boolean;
  show_as_expense: boolean;
  affects_account_balance: boolean;
  source: TransactionSource;
  subscription_id?: mongoose.Types.ObjectId | null;
  debt_id?: mongoose.Types.ObjectId | null;
  is_deleted: boolean;
  created_at: Date;
}

const TransactionSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: Object.values(TransactionType), 
    required: true 
  },
  amount: { type: Schema.Types.Decimal128, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  category_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  related_account_id: { type: Schema.Types.ObjectId, ref: 'Account', default: null },
  is_external_payment: { type: Boolean, default: false },
  show_as_expense: { type: Boolean, default: false },
  affects_account_balance: { type: Boolean, default: true },
  source: { 
    type: String, 
    enum: Object.values(TransactionSource), 
    required: true 
  },
  subscription_id: { type: Schema.Types.ObjectId, ref: 'Subscription', default: null },
  debt_id: { type: Schema.Types.ObjectId, ref: 'Debt', default: null },
  is_deleted: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

TransactionSchema.index({ user_id: 1, date: -1 });
TransactionSchema.index({ user_id: 1, account_id: 1, date: -1 });
TransactionSchema.index({ user_id: 1, category_id: 1 });
TransactionSchema.index({ user_id: 1, subscription_id: 1 });

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
