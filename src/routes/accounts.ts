import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Account } from "../models/Account";
import mongoose from "mongoose";

const router = Router();

// GET all accounts for the user
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accounts = await Account.find({ user_id: req.userId });
    return res.json({ success: true, accounts });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST create a new account
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, balance, credit_card_details } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, error: "Name and type are required" });
    }

    const acc = await Account.create({
      user_id: req.userId,
      name,
      type,
      balance: mongoose.Types.Decimal128.fromString(balance.toString()),
      credit_card_details: credit_card_details ? {
        total_limit: mongoose.Types.Decimal128.fromString(credit_card_details.total_limit.toString()),
        current_debt: mongoose.Types.Decimal128.fromString(credit_card_details.current_debt.toString()),
        statement_day: credit_card_details.statement_day,
        payment_due_day: credit_card_details.payment_due_day
      } : undefined
    });

    return res.status(201).json({ success: true, id: acc._id.toString(), account: acc });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update an account
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, balance } = req.body;

    const account = await Account.findOne({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!account) {
      return res.status(404).json({ success: false, error: "Account not found" });
    }

    if (name !== undefined) {
      account.name = name;
    }

    if (balance !== undefined) {
      if (account.type === 'credit_card') {
        if (account.credit_card_details) {
          account.credit_card_details.current_debt = mongoose.Types.Decimal128.fromString(balance.toString());
        }
      } else {
        account.balance = mongoose.Types.Decimal128.fromString(balance.toString());
      }
    }

    await account.save();
    return res.json({ success: true, account });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE an account
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Account.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!result) {
      return res.status(404).json({ success: false, error: "Account not found" });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
