import type { Request, Response } from "express";
import { profileService } from "../services/profile.service.js";

// Returns the profile of the authenticated user.
export async function profileHandler(req: Request, res: Response) {
    const userId = res.locals.userId as string;

    const user = await profileService(userId);

    return res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: user,
    });
}
