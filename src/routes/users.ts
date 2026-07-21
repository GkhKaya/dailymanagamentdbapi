import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();

// GET user profile
router.get("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    if (!user.profile) {
      user.profile = { name: (user as any).name || (user as any)._doc?.name || "" };
    }
    if (!user.settings) {
      user.settings = { currency: "TRY" };
    }
    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update user profile
router.put("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, birth_date, gender, height_cm, activity_level, bmr_formula, target_weight_kg, daily_calorie_goal, currency, timezone } = req.body;
    
    const updateObj: any = {};
    if (name !== undefined) updateObj["profile.name"] = name;
    if (birth_date !== undefined) updateObj["profile.birth_date"] = birth_date ? new Date(birth_date) : undefined;
    if (gender !== undefined) updateObj["profile.gender"] = gender;
    if (height_cm !== undefined) updateObj["profile.height_cm"] = height_cm ? parseFloat(height_cm) : undefined;
    if (activity_level !== undefined) updateObj["profile.activity_level"] = activity_level;
    if (bmr_formula !== undefined) updateObj["profile.bmr_formula"] = bmr_formula;
    if (target_weight_kg !== undefined) updateObj["target_weight_kg"] = target_weight_kg ? parseFloat(target_weight_kg) : undefined;
    
    if (daily_calorie_goal !== undefined) updateObj["settings.daily_calorie_goal"] = daily_calorie_goal ? parseFloat(daily_calorie_goal) : undefined;
    if (currency !== undefined) updateObj["settings.currency"] = currency;
    if (timezone !== undefined) updateObj["settings.timezone"] = timezone;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateObj },
      { new: true, runValidators: false }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (!user.profile) {
      user.profile = { name: (user as any).name || (user as any)._doc?.name || "" };
    }
    if (!user.settings) {
      user.settings = { currency: "TRY" };
    }

    return res.json({ success: true, user });
  } catch (error: any) {
    console.error("PUT profile error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
