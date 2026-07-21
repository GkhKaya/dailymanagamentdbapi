import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Debt } from "../models/Debt";
import { DebtStatus } from "../models/Enums";
import mongoose from "mongoose";

const router = Router();

// GET all debts
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const debts = await Debt.find({ user_id: req.userId }).sort({ date: -1 });
    return res.json({ success: true, debts });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a debt
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { person_name, direction, amount, date, due_date } = req.body;
    if (!person_name || !direction || amount === undefined || !date) {
      return res.status(400).json({ success: false, error: "person_name, direction, amount, and date are required" });
    }

    const numericAmount = parseFloat(amount.toString());

    const debt = await Debt.create({
      user_id: req.userId,
      person_name,
      direction,
      original_amount: mongoose.Types.Decimal128.fromString(numericAmount.toString()),
      remaining_amount: mongoose.Types.Decimal128.fromString(numericAmount.toString()),
      date: new Date(date),
      due_date: due_date ? new Date(due_date) : null,
      status: DebtStatus.OPEN,
      payments: []
    });

    return res.status(201).json({ success: true, debt });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update a debt
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { person_name, direction, original_amount, remaining_amount, date, due_date, status } = req.body;

    const debt = await Debt.findOne({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!debt) {
      return res.status(404).json({ success: false, error: "Debt not found" });
    }

    if (person_name !== undefined) debt.person_name = person_name;
    if (direction !== undefined) debt.direction = direction;
    if (original_amount !== undefined) debt.original_amount = mongoose.Types.Decimal128.fromString(original_amount.toString());
    if (remaining_amount !== undefined) debt.remaining_amount = mongoose.Types.Decimal128.fromString(remaining_amount.toString());
    if (date !== undefined) debt.date = new Date(date);
    if (due_date !== undefined) debt.due_date = due_date ? new Date(due_date) : null;
    if (status !== undefined) debt.status = status;

    await debt.save();
    return res.json({ success: true, debt });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a payment to a debt
router.post("/:id/payments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, date, note, transaction_id } = req.body;

    if (amount === undefined || !date) {
      return res.status(400).json({ success: false, error: "amount and date are required" });
    }

    const debt = await Debt.findOne({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!debt) {
      return res.status(404).json({ success: false, error: "Debt not found" });
    }

    const payAmount = parseFloat(amount.toString());
    const remaining = parseFloat(debt.remaining_amount.toString()) - payAmount;
    
    debt.remaining_amount = mongoose.Types.Decimal128.fromString(Math.max(0, remaining).toString());
    
    if (remaining <= 0) {
      debt.status = DebtStatus.CLOSED;
    } else {
      debt.status = DebtStatus.PARTIALLY_PAID;
    }

    debt.payments.push({
      date: new Date(date),
      amount: mongoose.Types.Decimal128.fromString(payAmount.toString()),
      transaction_id: transaction_id ? new mongoose.Types.ObjectId(transaction_id) : null,
      note: note || null
    });

    await debt.save();
    return res.json({ success: true, debt });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a debt
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Debt.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!result) {
      return res.status(404).json({ success: false, error: "Debt not found" });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
