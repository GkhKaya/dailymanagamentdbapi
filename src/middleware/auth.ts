import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { fromNodeHeaders } from "better-auth/node";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.userId = session.user.id;
    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication check failed: " + err.message });
  }
};
