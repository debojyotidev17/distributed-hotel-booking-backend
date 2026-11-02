import { Router } from "express";

import { createDemoBookingController } from "../controllers/booking.controller.js";
import { confirmBookingController } from "../controllers/booking-confirmation.controller.js";

import {
    validateRequestBody,
    validateRequestParams,
} from "../validators/index.js";

import {
    createDemoBookingSchema,
    confirmBookingParamsSchema,
} from "../validators/booking.validator.js";


const router = Router();

// Create a pending booking.
router.post(
    "/",
    validateRequestBody(createDemoBookingSchema),
    createDemoBookingController,
);

// Confirm a pending booking using its idempotency key.
router.post(
    "/:idempotencyKey/confirm",
    validateRequestParams(confirmBookingParamsSchema),
    confirmBookingController,
);

export default router;
