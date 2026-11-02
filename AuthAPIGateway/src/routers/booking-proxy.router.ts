import express from "express";
import type { Request } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

import { serverConfig } from "../config/server.config.js";
import { authenticateMiddleware } from "../middlewares/authenticate.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const bookingProxyRouter = express.Router();

// Sends booking requests to BookingService without changing its expected paths.
const bookingServiceProxy = createProxyMiddleware({
    target: serverConfig.BOOKING_SERVICE_URL,
    changeOrigin: true,

    // Keep /bookings because BookingService mounts its router at that path.
    pathRewrite: (_path, req) => (req as Request).originalUrl,

    // express.json() has already consumed the body, so restore it for the proxy.
    on: {
        proxyReq: fixRequestBody,
    },
});

// -------------------- Create Pending Booking --------------------
// Only authenticated users with booking:create can start a booking.
bookingProxyRouter.post(
    "/",
    authenticateMiddleware,
    requirePermission("booking:create"),
    bookingServiceProxy,
);

// -------------------- Confirm Booking --------------------
// Confirmation completes the booking started by the create endpoint.
bookingProxyRouter.post(
    "/:idempotencyKey/confirm",
    authenticateMiddleware,
    requirePermission("booking:create"),
    bookingServiceProxy,
);

export default bookingProxyRouter;
