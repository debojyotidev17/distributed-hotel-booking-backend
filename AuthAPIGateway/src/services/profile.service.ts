import { findUserById } from "../repositories/user.repository.js";
import { NotFoundError } from "../utils/errors/app.error.js";

// Fetches the profile of an authenticated user.
export const profileService = async (userId: string) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const { password, ...safeUser } = user;

    return safeUser;
};
