import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Transaction } from "../models/Transaction";
import { Account } from "../models/Account";
import mongoose from "mongoose";

const router = Router();

// GET all transactions
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({ user_id: req.userId, is_deleted: false }).sort({ date: -1 });
    return res.json({ success: true, transactions });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a transaction
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, amount, date, description, category_id, account_id, source } = req.body;
    if (!type || amount === undefined || !date || !description || !account_id) {
      return res.status(400).json({ success: false, error: "type, amount, date, description, and account_id are required" });
    }

    const numericAmount = parseFloat(amount.toString());

    const txn = await Transaction.create({
      user_id: req.userId,
      type,
      amount: mongoose.Types.Decimal128.fromString(numericAmount.toString()),
      date: new Date(date),
      description,
      category_id: category_id ? new mongoose.Types.ObjectId(category_id) : null,
      account_id: new mongoose.Types.ObjectId(account_id),
      source: source || "manual"
    });

    // Update account balance
    const account = await Account.findOne({ _id: new mongoose.Types.ObjectId(account_id), user_id: req.userId });
    if (account) {
      let currentBal = parseFloat(account.balance.toString());
      if (type === 'income') {
        currentBal += numericAmount;
      } else {
        currentBal -= numericAmount;
      }
      account.balance = mongoose.Types.Decimal128.fromString(currentBal.toString());
      await account.save();
    }

    return res.status(201).json({ success: true, transaction: txn });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update a transaction
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, amount, date, description, category_id, account_id } = req.body;

    const txn = await Transaction.findOne({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!txn) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    const oldAmount = parseFloat(txn.amount.toString());
    const oldType = txn.type;
    const oldAccountId = txn.account_id.toString();

    // Revert old transaction effect on old account
    const oldAccount = await Account.findOne({ _id: txn.account_id, user_id: req.userId });
    if (oldAccount) {
      let oldBal = parseFloat(oldAccount.balance.toString());
      if (oldType === 'income') {
        oldBal -= oldAmount;
      } else {
        oldBal += oldAmount;
      }
      oldAccount.balance = mongoose.Types.Decimal128.fromString(oldBal.toString());
      await oldAccount.save();
    }

    // Apply new transaction effect on new account
    const newAccountId = account_id || oldAccountId;
    const newAmount = amount !== undefined ? parseFloat(amount.toString()) : oldAmount;
    const newType = type || oldType;

    const newAccount = await Account.findOne({ _id: new mongoose.Types.ObjectId(newAccountId), user_id: req.userId });
    if (newAccount) {
      let newBal = parseFloat(newAccount.balance.toString());
      if (newType === 'income') {
        newBal += newAmount;
      } else {
        newBal -= newAmount;
      }
      newAccount.balance = mongoose.Types.Decimal128.fromString(newBal.toString());
      await newAccount.save();
    }

    // Update the transaction itself
    if (type !== undefined) txn.type = type;
    if (amount !== undefined) txn.amount = mongoose.Types.Decimal128.fromString(newAmount.toString());
    if (date !== undefined) txn.date = new Date(date);
    if (description !== undefined) txn.description = description;
    if (category_id !== undefined) txn.category_id = category_id ? new mongoose.Types.ObjectId(category_id) : null;
    if (account_id !== undefined) txn.account_id = new mongoose.Types.ObjectId(account_id);

    await txn.save();
    return res.json({ success: true, transaction: txn });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a transaction
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const txn = await Transaction.findOne({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!txn) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    // Revert account balance
    const account = await Account.findOne({ _id: txn.account_id, user_id: req.userId });
    if (account) {
      let currentBal = parseFloat(account.balance.toString());
      if (txn.type === 'income') {
        currentBal -= parseFloat(txn.amount.toString());
      } else {
        currentBal += parseFloat(txn.amount.toString());
      }
      account.balance = mongoose.Types.Decimal128.fromString(currentBal.toString());
      await account.save();
    }

    await Transaction.deleteOne({ _id: txn._id });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
