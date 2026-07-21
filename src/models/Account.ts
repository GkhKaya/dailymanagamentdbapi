import mongoose, { Schema, Document } from 'mongoose';
import { AccountType } from './Enums';

export interface IAccount extends Document {
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: mongoose.Types.Decimal128;
  include_in_total_balance: boolean;
  is_active: boolean;
  credit_card_details?: {
    total_limit: mongoose.Types.Decimal128;
    current_debt: mongoose.Types.Decimal128;
    statement_day: number;
    payment_due_day: number;
  };
  created_at: Date;
  updated_at: Date;
}

const AccountSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(AccountType), required: true },
  currency: { type: String, default: 'TRY' },
  balance: { type: Schema.Types.Decimal128, required: true, default: 0 },
  include_in_total_balance: { type: Boolean, default: true },
  is_active: { type: Boolean, default: true },
  credit_card_details: {
    total_limit: { 
      type: Schema.Types.Decimal128,
      required: function(this: any) { return this.type === AccountType.CREDIT_CARD; }
    },
    current_debt: { 
      type: Schema.Types.Decimal128,
      required: function(this: any) { return this.type === AccountType.CREDIT_CARD; }
    },
    statement_day: { 
      type: Number, min: 1, max: 31,
      required: function(this: any) { return this.type === AccountType.CREDIT_CARD; }
    },
    payment_due_day: { 
      type: Number, min: 1, max: 31,
      required: function(this: any) { return this.type === AccountType.CREDIT_CARD; }
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

AccountSchema.index({ user_id: 1, type: 1 });

export const Account = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
