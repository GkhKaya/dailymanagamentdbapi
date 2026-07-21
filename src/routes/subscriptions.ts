import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Subscription } from "../models/Subscription";
import mongoose from "mongoose";

const router = Router();

// GET all subscriptions
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriptions = await Subscription.find({ user_id: req.userId }).sort({ created_at: -1 });
    return res.json({ success: true, subscriptions });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a subscription
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, amount, category_id, account_id, frequency, billing_day, next_run_date, is_active } = req.body;
    if (!name || amount === undefined || !category_id || !account_id || !frequency || billing_day === undefined || !next_run_date) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const numericAmount = parseFloat(amount.toString());

    const subscription = await Subscription.create({
      user_id: req.userId,
      name,
      amount: mongoose.Types.Decimal128.fromString(numericAmount.toString()),
      category_id: new mongoose.Types.ObjectId(category_id),
      account_id: new mongoose.Types.ObjectId(account_id),
      frequency,
      billing_day,
      next_run_date: new Date(next_run_date),
      is_active: is_active !== undefined ? is_active : true
    });

    return res.status(201).json({ success: true, subscription });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update a subscription
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, amount, category_id, account_id, frequency, billing_day, next_run_date, is_active } = req.body;

    const subscription = await Subscription.findOne({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!subscription) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    if (name !== undefined) subscription.name = name;
    if (amount !== undefined) subscription.amount = mongoose.Types.Decimal128.fromString(amount.toString());
    if (category_id !== undefined) subscription.category_id = new mongoose.Types.ObjectId(category_id);
    if (account_id !== undefined) subscription.account_id = new mongoose.Types.ObjectId(account_id);
    if (frequency !== undefined) subscription.frequency = frequency;
    if (billing_day !== undefined) subscription.billing_day = billing_day;
    if (next_run_date !== undefined) subscription.next_run_date = new Date(next_run_date);
    if (is_active !== undefined) subscription.is_active = is_active;

    await subscription.save();
    return res.json({ success: true, subscription });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a subscription
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Subscription.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!result) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
