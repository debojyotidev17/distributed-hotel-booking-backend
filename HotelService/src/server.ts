import express from "express";

import logger from "./config/logger.config.js";
import { serverConfig } from "./config/server.config.js";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware.js";
import { genericErrorHandler } from "./middlewares/error.middleware.js";
import cityRouter from "./routers/city.router.js";
import hotelRouter from "./routers/hotel.router.js";
import stateRouter from "./routers/state.router.js";
import { startAvailabilityScheduler } from "./schedulers/availability.scheduler.js";
import { startWorkers } from "./processors/room-generation.processor.js";

const app = express();

app.use(express.json());
app.use(attachCorrelationIdMiddleware);

app.use("/states", stateRouter);
app.use("/cities", cityRouter);
app.use("/hotels", hotelRouter);

// Handles errors forwarded by routes and middleware.
app.use(genericErrorHandler);

app.listen(serverConfig.PORT, async () => {
    logger.info(`HotelService is running on port ${serverConfig.PORT}`);

    startAvailabilityScheduler();

    try {
        await startWorkers();
        logger.info("Room-generation worker started");
    } catch (error) {
        logger.error(
            `Failed to start room-generation worker: ${String(error)}`,
        );
    }
});
