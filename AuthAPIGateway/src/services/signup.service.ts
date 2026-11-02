import bcrypt from "bcryptjs";

import db from "../models/index.js";

import { users } from "../models/schemas/user.schema.js";
import { userRoles } from "../models/schemas/user-role.schema.js";

import { findRoleByName} from "../repositories/role.repository.js"
import { findUserByEmail } from "../repositories/user.repository.js";

import type { SignupDto } from "../dtos/signup.dto.js";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error.js";

// Registers a new user and assigns the default customer role.
export const signupService = async (signupData: SignupDto) => {
    // This ensures that USER@gmail.com and user@gmail.com are treated consistently by our application
    const email = signupData.email.toLowerCase();

    // Check whether an account with this email already exists.
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        throw new BadRequestError("Email is already registered");
    }

    // Find the default customer role.
    const customerRole = await findRoleByName("customer");

    if (!customerRole) {
        throw new NotFoundError("Default customer role not found");
    }

    // Hash the password before storing it in the database.
    const hashedPassword = await bcrypt.hash(signupData.password, 10);

    // Create the user and assign the customer role in one transaction.

    /** 
    Imagine the user is successfully inserted, but assigning the customer role fails.

    Without a transaction, the user could exist without a role.
    
    With a transaction, both database operations succeed together or both are rolled back
    */
    const newUser = await db.transaction(async (tx) => {
        const [user] = await tx
            .insert(users)
            .values({
                username: signupData.username,
                email,
                password: hashedPassword,
            })
            .returning();

        await tx.insert(userRoles).values({
            userId: user.id,
            roleId: customerRole.id,
        });

        return user;
    });

    // Never return the user's password hash in the response.
    const { password, ...safeUser } = newUser;

    return safeUser;
};;
