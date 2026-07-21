import mongoose, { Schema, Document } from 'mongoose';
import { DebtDirection, DebtStatus } from './Enums';

export interface IDebt extends Document {
  user_id: string;
  person_name: string;
  direction: DebtDirection;
  original_amount: mongoose.Types.Decimal128;
  remaining_amount: mongoose.Types.Decimal128;
  date: Date;
  due_date?: Date | null;
  status: DebtStatus;
  payments: {
    date: Date;
    amount: mongoose.Types.Decimal128;
    transaction_id?: mongoose.Types.ObjectId | null;
    note?: string | null;
  }[];
  created_at: Date;
}

const DebtSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  person_name: { type: String, required: true },
  direction: { type: String, enum: Object.values(DebtDirection), required: true },
  original_amount: { type: Schema.Types.Decimal128, required: true },
  remaining_amount: { type: Schema.Types.Decimal128, required: true },
  date: { type: Date, required: true },
  due_date: { type: Date, default: null },
  status: { type: String, enum: Object.values(DebtStatus), required: true },
  payments: [{
    date: { type: Date, required: true },
    amount: { type: Schema.Types.Decimal128, required: true },
    transaction_id: { type: Schema.Types.ObjectId, ref: 'Transaction', default: null },
    note: { type: String, default: null }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

DebtSchema.index({ user_id: 1, status: 1 });

export const Debt = mongoose.models.Debt || mongoose.model<IDebt>('Debt', DebtSchema);
