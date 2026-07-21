import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { SavedFood } from "../models/SavedFood";
import mongoose from "mongoose";

const router = Router();

// GET all saved foods (recipes)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const foods = await SavedFood.find({ user_id: req.userId }).sort({ created_at: -1 });
    return res.json({ success: true, savedFoods: foods });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a saved food
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { food_name, serving_description, quantity, fatsecret_food_id, calories, protein_g, carbs_g, fat_g } = req.body;
    if (!food_name || !serving_description || quantity === undefined || calories === undefined || protein_g === undefined || carbs_g === undefined || fat_g === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const saved = await SavedFood.create({
      user_id: req.userId,
      food_name,
      serving_description,
      quantity: parseFloat(quantity),
      fatsecret_food_id: fatsecret_food_id || null,
      calories: parseFloat(calories),
      protein_g: parseFloat(protein_g),
      carbs_g: parseFloat(carbs_g),
      fat_g: parseFloat(fat_g)
    });

    return res.status(201).json({ success: true, savedFood: saved });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a saved food
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await SavedFood.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), user_id: req.userId });
    if (!result) {
      return res.status(404).json({ success: false, error: "Saved food not found" });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
