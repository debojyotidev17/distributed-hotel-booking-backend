import express from "express";

import { signupHandler } from "../controllers/signup.controller.js";
import { loginHandler } from "../controllers/login.controller.js";
import { profileHandler } from "../controllers/profile.controller.js";
import { authenticateMiddleware } from "../middlewares/authenticate.middleware.js";
import { requireAnyRole } from "../middlewares/authorize-role.middleware.js";

import { validateRequestBody } from "../validators/index.js";
import { signupSchema } from "../validators/signup.validator.js";
import { loginSchema } from "../validators/login.validator.js";

const authRouter = express.Router();

// Registers a new user after validating the request body.
authRouter.post("/signup", validateRequestBody(signupSchema), signupHandler);

// Authenticates a user after validating the request body.
authRouter.post("/login", validateRequestBody(loginSchema), loginHandler);

authRouter.get(
    "/profile",
    authenticateMiddleware,
    requireAnyRole("customer", "hotel_manager", "admin"),
    profileHandler,
);

export default authRouter;
