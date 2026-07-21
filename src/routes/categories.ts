import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Category } from "../models/Category";
import mongoose from "mongoose";

const router = Router();

// GET all categories for the user (seeds defaults if 0 categories exist for the user)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userCategoryCount = await Category.countDocuments({ user_id: userId });

    if (userCategoryCount === 0) {
      const defaultCats = [
        { user_id: userId, name: 'Market', type: 'expense', icon: 'cart', color: '#ef4444', is_default: false },
        { user_id: userId, name: 'Ulaşım', type: 'expense', icon: 'car', color: '#f59e0b', is_default: false },
        { user_id: userId, name: 'Eğlence', type: 'expense', icon: 'film', color: '#8b5cf6', is_default: false },
        { user_id: userId, name: 'Kafe/Restoran', type: 'expense', icon: 'coffee', color: '#f43f5e', is_default: false },
        { user_id: userId, name: 'Faturalar', type: 'expense', icon: 'zap', color: '#0ea5e9', is_default: false },
        { user_id: userId, name: 'Ev/Kira', type: 'expense', icon: 'home', color: '#10b981', is_default: false },
        { user_id: userId, name: 'Sağlık', type: 'expense', icon: 'heart', color: '#ec4899', is_default: false },
        { user_id: userId, name: 'Maaş', type: 'income', icon: 'briefcase', color: '#22c55e', is_default: false },
        { user_id: userId, name: 'Yatırım Getirisi', type: 'income', icon: 'trending', color: '#3b82f6', is_default: false },
        { user_id: userId, name: 'Diğer (Gelir)', type: 'income', icon: 'gift', color: '#14b8a6', is_default: false },
      ];
      await Category.insertMany(defaultCats);
    }

    const categories = await Category.find({ $or: [{ user_id: userId }, { is_default: true }] });
    return res.json({ success: true, categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a new category
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type || !icon || !color) {
      return res.status(400).json({ success: false, error: "name, type, icon, and color are required" });
    }

    const category = await Category.create({
      user_id: req.userId,
      name,
      type,
      icon,
      color,
      is_default: false
    });

    return res.status(201).json({ success: true, category });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a category
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Category.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      user_id: req.userId,
      is_default: false
    });

    if (!result) {
      return res.status(404).json({ success: false, error: "Category not found or cannot delete a default category" });
    }

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
