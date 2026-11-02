import express from "express";
import logger from "./config/logger.config.js";

import { serverConfig } from "./config/server.config.js";
import { genericErrorHandler } from "./middlewares/error.middleware.js";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware.js";

import authRouter from "./routers/auth.router.js";
import roleRouter from "./routers/role.router.js";
import permissionRouter from "./routers/permission.router.js";

import hotelProxyRouter from "./routers/hotel-proxy.router.js";
import bookingProxyRouter from "./routers/booking-proxy.router.js";

const app = express();

// Gives each incoming request a unique ID for tracing logs
app.use(attachCorrelationIdMiddleware);
// Parses JSON request bodies into req.body
app.use(express.json());

app.use("/auth", authRouter);
app.use("/roles", permissionRouter);
app.use("/roles", roleRouter);

// Forward hotel-related requests to HotelService.
app.use("/hotels", hotelProxyRouter);

// Forward booking requests to BookingService.
app.use("/bookings", bookingProxyRouter);

// Converts thrown errors into HTTP responses
app.use(genericErrorHandler);

// Starts the HTTP server
app.listen(serverConfig.PORT, () => {
    logger.info(`AuthGateway is running on port ${serverConfig.PORT}`);
});
