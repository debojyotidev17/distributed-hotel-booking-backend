import type { Request, Response } from "express";

import { signupService } from "../services/signup.service.js";
import type { SignupDto } from "../dtos/signup.dto.js";

// Registers a new user.
export async function signupHandler(req: Request, res: Response) {
    const newUser = await signupService(req.body as SignupDto);

    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: newUser,
    });
}
