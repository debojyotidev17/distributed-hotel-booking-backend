/*
 * The same period ID can appear in jobs on different days as the booking window moves.
 * Example: a saved period [Jan 20, Feb 4) produces a job [Jan 20, Feb 1) when the window ends Feb 1.
 * The next day, it can produce [Jan 20, Feb 2); the worker skips existing room/date rows and adds missing ones.
 */

export type RoomGenerationJobDto = {
    // Identifies the saved availability period.
    availabilityPeriodId: string;

    // The first date to process, included in the job range.
    startDate: string;

    // The first date not to process; this end date is exclusive.
    endDate: string;
};
