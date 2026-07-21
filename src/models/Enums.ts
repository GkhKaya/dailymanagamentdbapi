export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

export enum BmrFormula {
  MIFFLIN_ST_JEOR = 'mifflin_st_jeor',
  HARRIS_BENEDICT = 'harris_benedict',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export enum ExerciseSource {
  MANUAL = 'manual',
  ESTIMATED = 'estimated',
}

export enum AccountType {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  BANK_ACCOUNT = 'bank_account',
  CREDIT_CARD = 'credit_card',
}

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  ACCOUNT_ADJUSTMENT = 'account_adjustment',
  CREDIT_CARD_PAYMENT = 'credit_card_payment',
  DEBT_PAYMENT = 'debt_payment',
}

export enum TransactionSource {
  MANUAL = 'manual',
  SUBSCRIPTION = 'subscription',
  ACCOUNT_EDIT = 'account_edit',
  VOICE = 'voice',
}

export enum SubscriptionFrequency {
  MONTHLY = 'monthly',
}

export enum DebtDirection {
  GIVEN = 'given',
  TAKEN = 'taken',
}

export enum DebtStatus {
  OPEN = 'open',
  PARTIALLY_PAID = 'partially_paid',
  CLOSED = 'closed',
}
