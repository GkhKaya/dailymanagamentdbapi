import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { WeightLog } from "../models/WeightLog";
import { User } from "../models/User";
import mongoose from "mongoose";

const router = Router();

// GET all weight logs for user
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await WeightLog.find({ user_id: req.userId }).sort({ date: -1 });
    return res.json({ success: true, weightLogs: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a weight log
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, weight_kg, note } = req.body;
    if (!date || weight_kg === undefined) {
      return res.status(400).json({ success: false, error: "date and weight_kg are required" });
    }

    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const log = await WeightLog.findOneAndUpdate(
      { user_id: req.userId, date: targetDate },
      {
        user_id: req.userId,
        date: targetDate,
        weight_kg: parseFloat(weight_kg),
        note: note || null
      },
      { upsert: true, new: true }
    );

    // Sync user current weight
    await User.findByIdAndUpdate(req.userId, {
      current_weight_kg: parseFloat(weight_kg)
    });

    return res.status(201).json({ success: true, weightLog: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a weight log
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await WeightLog.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!result) {
      return res.status(404).json({ success: false, error: "Weight log not found" });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
