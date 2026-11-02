import express from "express";
import logger from "./config/logger.config.js";

import { serverConfig } from "./config/server.config.js";
import { genericErrorHandler } from "./middlewares/error.middleware.js";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware.js";
import bookingRouter from "./routers/booking.router.js";
import { startBookingExpiryScheduler } from "./schedulers/booking-expiry.scheduler.js";

const app = express();

app.use(attachCorrelationIdMiddleware);
app.use(express.json());

app.use("/bookings", bookingRouter);

app.use(genericErrorHandler);

app.listen(serverConfig.PORT, () => {
    logger.info(`Server is running on ${serverConfig.PORT}`);

    // Start checking for expired bookings once the server is running.
    startBookingExpiryScheduler();
});
