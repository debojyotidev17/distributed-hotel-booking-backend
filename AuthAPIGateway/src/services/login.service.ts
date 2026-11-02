import bcrypt from "bcryptjs";

import { findUserByEmail } from "../repositories/user.repository.js";
import { generateAccessToken } from "../utils/helpers/jwt.helper.js";

import type { LoginDto } from "../dtos/login.dto.js";
import { BadRequestError } from "../utils/errors/app.error.js";

// Authenticates a user and generates an access token.
export const loginService = async (loginData: LoginDto) => {
    const email = loginData.email.toLowerCase();

    // Find the user using their email address.
    const user = await findUserByEmail(email);

    // If you return "Email not found", someone can test different email addresses and discover which users have registered accounts. This is called user enumeration.
    if (!user) {
        throw new BadRequestError("Invalid email or password");
    }

    // Compare the submitted password with the stored password hash.
    const isPasswordValid = await bcrypt.compare(
        loginData.password,
        user.password,
    );

    if (!isPasswordValid) {
        throw new BadRequestError("Invalid email or password");
    }

    // Generate an access token for the authenticated user.
    const accessToken = generateAccessToken(user.id);

    // Never return the user's password hash in the response.
    const { password, ...safeUser } = user;

    return {
        user: safeUser,
        accessToken,
    };
};