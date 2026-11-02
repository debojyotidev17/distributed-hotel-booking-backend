import type { Request, Response } from "express";

import { loginService } from "../services/login.service.js";
import type { LoginDto } from "../dtos/login.dto.js";

// Authenticates a user and returns an access token.
export async function loginHandler(req: Request, res: Response) {
    const loginData = req.body as LoginDto;

    const loginResult = await loginService(loginData);

    return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: loginResult,
    });
}
