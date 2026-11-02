import { eq } from "drizzle-orm";

import db from "../models/index.js";
import { users } from "../models/schemas/user.schema.js";
import type { SignupDto } from "../dtos/signup.dto.js";

// Finds a user using their email address.
export const findUserByEmail = async (email: string) => {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    return user;
};

// Creates a new user in the database.
export const createUser = async (userData: SignupDto) => {
    const [user] = await db.insert(users).values(userData).returning();

    return user;
};

// Finds a user using their ID.
export const findUserById = async (userId: string) => {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    return user;
};
