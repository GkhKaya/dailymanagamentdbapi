import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { DailyLog } from "../models/DailyLog";
import { SavedFood } from "../models/SavedFood";
import { FoodCache } from "../models/FoodCache";
import mongoose from "mongoose";

const router = Router();

// Helper to standardise date to UTC 00:00:00
function getUTCDate(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// GET daily log by date
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, error: "Date parameter is required" });
    }

    const targetDate = getUTCDate(date.toString());
    let log = await DailyLog.findOne({ user_id: req.userId, date: targetDate });

    // If no log exists, return an empty template instead of creating in database immediately (saves storage)
    if (!log) {
      return res.json({
        success: true,
        dailyLog: {
          user_id: req.userId,
          date: targetDate,
          meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
          sleep: { duration_minutes: 0, calories_burned: 0, quality: null },
          exercises: [],
          totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
        }
      });
    }

    return res.json({ success: true, dailyLog: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a meal entry
router.post("/meals", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, type, food_name, serving_description, quantity, calories, protein_g, carbs_g, fat_g, fatsecret_food_id, save_as_recipe } = req.body;
    if (!date || !type || !food_name || !serving_description || quantity === undefined || calories === undefined || protein_g === undefined || carbs_g === undefined || fat_g === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const targetDate = getUTCDate(date);

    let log = await DailyLog.findOne({ user_id: req.userId, date: targetDate });
    if (!log) {
      log = new DailyLog({
        user_id: req.userId,
        date: targetDate,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        sleep: { duration_minutes: 0, calories_burned: 0 },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    const newFood = {
      entry_id: new mongoose.Types.ObjectId(),
      food_name,
      serving_description,
      quantity: parseFloat(quantity),
      fatsecret_food_id,
      nutrition_snapshot: {
        calories: parseFloat(calories),
        protein_g: parseFloat(protein_g),
        carbs_g: parseFloat(carbs_g),
        fat_g: parseFloat(fat_g)
      },
      added_at: new Date()
    };

    // Push to the correct meal array
    const meals = log.meals as any;
    if (meals[type]) {
      meals[type].push(newFood);
    } else {
      return res.status(400).json({ success: false, error: `Invalid meal type: ${type}` });
    }

    // Update totals
    log.totals.calories_consumed += parseFloat(calories);
    log.totals.protein_g += parseFloat(protein_g);
    log.totals.carbs_g += parseFloat(carbs_g);
    log.totals.fat_g += parseFloat(fat_g);

    await log.save();

    // Save as recipe if requested
    if (save_as_recipe) {
      await SavedFood.create({
        user_id: req.userId,
        food_name,
        serving_description,
        quantity: parseFloat(quantity),
        fatsecret_food_id,
        calories: parseFloat(calories),
        protein_g: parseFloat(protein_g),
        carbs_g: parseFloat(carbs_g),
        fat_g: parseFloat(fat_g)
      });
    }

    // Auto-cache to FoodCache
    if (fatsecret_food_id) {
      try {
        const qty = parseFloat(quantity) || 1;
        const parts = serving_description.split(' ');
        const unitName = parts.length > 1 ? parts.slice(1).join(' ') : 'gram';
        
        const baseCalories = parseFloat(calories) / qty;
        const baseProtein = parseFloat(protein_g) / qty;
        const baseCarbs = parseFloat(carbs_g) / qty;
        const baseFat = parseFloat(fat_g) / qty;
        
        let descString = `1 ${unitName}`;
        if (unitName.toLowerCase() === 'gram') descString = 'Per 100g';
        else if (unitName.toLowerCase() === 'adet') descString = '1 adet';
        else if (unitName.toLowerCase() === 'porsiyon') descString = '1 porsiyon';
        
        descString += ` - Calories: ${Math.round(baseCalories)}kcal | Fat: ${baseFat.toFixed(2)}g | Carbs: ${baseCarbs.toFixed(2)}g | Protein: ${baseProtein.toFixed(2)}g`;

        await FoodCache.updateOne(
          { fatsecret_food_id },
          {
            $setOnInsert: {
              food_name,
              brand_name: null,
              servings: [{
                serving_id: `custom_${Date.now()}`,
                description: descString,
                calories: baseCalories,
                protein_g: baseProtein,
                carbs_g: baseCarbs,
                fat_g: baseFat
              }]
            }
          },
          { upsert: true }
        );
      } catch (cacheErr) {
        console.error("FoodCache upsert error:", cacheErr);
      }
    }

    return res.json({ success: true, dailyLog: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update a meal entry
router.put("/meals", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, entry_id, type, old_type, food_name, serving_description, quantity, calories, protein_g, carbs_g, fat_g } = req.body;
    if (!date || !entry_id || !type || !old_type || !food_name || !serving_description || quantity === undefined || calories === undefined || protein_g === undefined || carbs_g === undefined || fat_g === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const targetDate = getUTCDate(date);
    const log = await DailyLog.findOne({ user_id: req.userId, date: targetDate });
    if (!log) {
      return res.status(404).json({ success: false, error: "Daily log not found" });
    }

    // Revert old values
    const oldMeals = (log.meals as any)[old_type];
    if (!oldMeals) {
      return res.status(400).json({ success: false, error: `Invalid old meal type: ${old_type}` });
    }

    const foodIdx = oldMeals.findIndex((f: any) => f.entry_id.toString() === entry_id);
    if (foodIdx === -1) {
      return res.status(404).json({ success: false, error: "Food entry not found in the daily log" });
    }

    const oldFood = oldMeals[foodIdx];
    log.totals.calories_consumed -= oldFood.nutrition_snapshot.calories;
    log.totals.protein_g -= oldFood.nutrition_snapshot.protein_g;
    log.totals.carbs_g -= oldFood.nutrition_snapshot.carbs_g;
    log.totals.fat_g -= oldFood.nutrition_snapshot.fat_g;

    // Remove from array
    oldMeals.splice(foodIdx, 1);

    // Create updated food entry
    const updatedFood = {
      entry_id: new mongoose.Types.ObjectId(entry_id),
      food_name,
      serving_description,
      quantity: parseFloat(quantity),
      fatsecret_food_id: oldFood.fatsecret_food_id,
      nutrition_snapshot: {
        calories: parseFloat(calories),
        protein_g: parseFloat(protein_g),
        carbs_g: parseFloat(carbs_g),
        fat_g: parseFloat(fat_g)
      },
      added_at: oldFood.added_at || new Date()
    };

    // Push to new meal type array
    const newMeals = (log.meals as any)[type];
    if (!newMeals) {
      return res.status(400).json({ success: false, error: `Invalid meal type: ${type}` });
    }
    newMeals.push(updatedFood);

    // Apply new totals
    log.totals.calories_consumed += parseFloat(calories);
    log.totals.protein_g += parseFloat(protein_g);
    log.totals.carbs_g += parseFloat(carbs_g);
    log.totals.fat_g += parseFloat(fat_g);

    await log.save();
    return res.json({ success: true, dailyLog: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a meal entry
router.post("/meals/delete", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, entry_id, type } = req.body;
    if (!date || !entry_id || !type) {
      return res.status(400).json({ success: false, error: "date, entry_id, and type are required" });
    }

    const targetDate = getUTCDate(date);
    const log = await DailyLog.findOne({ user_id: req.userId, date: targetDate });
    if (!log) {
      return res.status(404).json({ success: false, error: "Daily log not found" });
    }

    const meals = (log.meals as any)[type];
    if (!meals) {
      return res.status(400).json({ success: false, error: `Invalid meal type: ${type}` });
    }

    const foodIdx = meals.findIndex((f: any) => f.entry_id.toString() === entry_id);
    if (foodIdx === -1) {
      return res.status(404).json({ success: false, error: "Food entry not found" });
    }

    const oldFood = meals[foodIdx];
    log.totals.calories_consumed -= oldFood.nutrition_snapshot.calories;
    log.totals.protein_g -= oldFood.nutrition_snapshot.protein_g;
    log.totals.carbs_g -= oldFood.nutrition_snapshot.carbs_g;
    log.totals.fat_g -= oldFood.nutrition_snapshot.fat_g;

    // Ensure totals don't fall below zero
    log.totals.calories_consumed = Math.max(0, log.totals.calories_consumed);
    log.totals.protein_g = Math.max(0, log.totals.protein_g);
    log.totals.carbs_g = Math.max(0, log.totals.carbs_g);
    log.totals.fat_g = Math.max(0, log.totals.fat_g);

    // Remove from array
    meals.splice(foodIdx, 1);

    await log.save();
    return res.json({ success: true, dailyLog: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST sleep update
router.post("/sleep", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, duration_minutes, calories_burned, quality } = req.body;
    if (!date || duration_minutes === undefined || calories_burned === undefined) {
      return res.status(400).json({ success: false, error: "date, duration_minutes, and calories_burned are required" });
    }

    const targetDate = getUTCDate(date);
    let log = await DailyLog.findOne({ user_id: req.userId, date: targetDate });
    if (!log) {
      log = new DailyLog({
        user_id: req.userId,
        date: targetDate,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        sleep: { duration_minutes: 0, calories_burned: 0 },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    // Revert old sleep burn
    log.totals.calories_burned_sleep = parseFloat(calories_burned);

    log.sleep = {
      duration_minutes: parseInt(duration_minutes),
      calories_burned: parseFloat(calories_burned),
      quality: quality || null
    };

    await log.save();
    return res.json({ success: true, dailyLog: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST add an exercise entry
router.post("/exercises", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, name, duration_minutes, calories_burned, source } = req.body;
    if (!date || !name || duration_minutes === undefined || calories_burned === undefined || !source) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const targetDate = getUTCDate(date);
    let log = await DailyLog.findOne({ user_id: req.userId, date: targetDate });
    if (!log) {
      log = new DailyLog({
        user_id: req.userId,
        date: targetDate,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        sleep: { duration_minutes: 0, calories_burned: 0 },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    const newExercise = {
      entry_id: new mongoose.Types.ObjectId(),
      name,
      duration_minutes: parseInt(duration_minutes),
      calories_burned: parseFloat(calories_burned),
      source
    };

    log.exercises.push(newExercise as any);
    log.totals.calories_burned_exercise += parseFloat(calories_burned);

    await log.save();
    return res.json({ success: true, dailyLog: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE an exercise entry
router.post("/exercises/delete", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, entry_id } = req.body;
    if (!date || !entry_id) {
      return res.status(400).json({ success: false, error: "date and entry_id are required" });
    }

    const targetDate = getUTCDate(date);
    const log = await DailyLog.findOne({ user_id: req.userId, date: targetDate });
    if (!log) {
      return res.status(404).json({ success: false, error: "Daily log not found" });
    }

    const exIdx = log.exercises.findIndex((e: any) => e.entry_id.toString() === entry_id);
    if (exIdx === -1) {
      return res.status(404).json({ success: false, error: "Exercise not found" });
    }

    const targetExercise = log.exercises[exIdx];
    log.totals.calories_burned_exercise -= targetExercise.calories_burned;
    log.totals.calories_burned_exercise = Math.max(0, log.totals.calories_burned_exercise);

    log.exercises.splice(exIdx, 1);

    await log.save();
    return res.json({ success: true, dailyLog: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
