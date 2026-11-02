import cron from "node-cron";

import logger from "../config/logger.config.js";
import { addRoomGenerationJobToQueue } from "../producers/room-generation.producer.js";
import { findAvailabilityPeriodsForDateRange } from "../repositories/availability-period.repository.js";
import { getIndiaBookingWindow } from "../utils/helpers/date.helper.js";

// We keep a reference to the cron task so we can check whether the scheduler is already running and stop it later if needed.
let schedulerTask: ReturnType<typeof cron.schedule> | undefined;

// Checks the current booking window and queues room-generation jobs for availability periods that overlap with that window.
// The scheduler does not create room-availability records itself.
// It only queues jobs; the BullMQ worker handles the actual generation.
export async function extendAvailabilityWindow() {
    // Get today's date and the exclusive end date of the booking window using India time, so our booking dates follow one consistent timezone.
    const { today, endDate: bookingWindowEnd } = getIndiaBookingWindow();

    // Fetch only the saved availability periods that overlap the current booking window instead of loading every period from the database.
    const periods = await findAvailabilityPeriodsForDateRange(
        today,
        bookingWindowEnd,
    );

    // Count how many generation jobs are successfully added to the queue.
    let jobsQueued = 0;

    // Process each matching availability period separately.
    for (const period of periods) {
        // Start from whichever date is later: today or the period's start.
        // This prevents us from generating availability for past dates.
        const startDate = period.startDate > today ? period.startDate : today;

        // End at whichever date is earlier: the period's end or the booking-window boundary. We must not generate beyond the window.
        const endDate =
            period.endDate < bookingWindowEnd
                ? period.endDate
                : bookingWindowEnd;

        // The end date is exclusive. If startDate >= endDate, there are no eligible dates to process, so skip this period.
        if (startDate >= endDate) {
            continue;
        }

        try {
            // Send the period ID and eligible date range to BullMQ.
            // The worker will use this information to generate availability.
            await addRoomGenerationJobToQueue({
                availabilityPeriodId: period.id,
                startDate,
                endDate,
            });

            // Count the job only after the queue operation succeeds.
            jobsQueued += 1;
        } catch (error) {
            // A queue failure for one period should not stop us from attempting to queue jobs for the remaining periods.
            logger.error(
                `Could not queue availability period ${period.id}: ${String(error)}`,
            );
        }
    }

    // This counts successfully queued jobs, not availability rows created.
    logger.info(
        `Booking-window check completed; queued ${jobsQueued} room-generation jobs`,
    );
}

// Starts the scheduler when the HotelService starts.
// We run one check immediately so availability does not have to wait until midnight, then register a daily check for 00:10 India time.
export function startAvailabilityScheduler() {
    // Prevent registering the same cron schedule more than once through this function in the current application instance.
    if (schedulerTask) {
        logger.warn("Availability scheduler is already running");
        return;
    }

    // Run the first booking-window check immediately.
    // We do not wait for it to finish before registering the daily schedule, but we catch and log any error from this initial check.
    void extendAvailabilityWindow().catch((error) => {
        logger.error(`Initial availability check failed: ${String(error)}`);
    });

    // Run another booking-window check every day at 00:10 in India.
    // As the window advances, periods can become eligible for additional dates.
    schedulerTask = cron.schedule(
        "10 0 * * *",
        async () => {
            try {
                await extendAvailabilityWindow();
            } catch (error) {
                // Handle unexpected errors that escape the individual queue-operation error handling inside extendAvailabilityWindow().
                logger.error(`Availability scheduler failed: ${String(error)}`);
            }
        },
        { timezone: "Asia/Kolkata" },
    );

    // This confirms that the cron schedule was registered.
    // It does not mean that the queued jobs have finished processing.
    logger.info("Availability scheduler started for 00:10 India time");
}

// Stops the daily cron schedule when we no longer need it.
// This does not cancel jobs already queued in BullMQ.
export function stopAvailabilityScheduler() {
    // Optional chaining prevents an error if no task has been registered.
    schedulerTask?.stop();

    // Clear the reference so the scheduler can be started again later.
    schedulerTask = undefined;
}