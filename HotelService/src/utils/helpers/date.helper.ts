// Returns today's calendar date in India as YYYY-MM-DD.
export function getIndiaDateString(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
}

// Adds calendar days to a date string without using the server's timezone.
export function addDaysToDateString(dateString: string, days: number) {
    const date = new Date(`${dateString}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);

    return date.toISOString().slice(0, 10);
}

// Returns today's India date and the exclusive end of its three-month booking window.
export function getIndiaBookingWindow() {
    const today = getIndiaDateString();
    const date = new Date(`${today}T00:00:00.000Z`);
    const targetMonthStart = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 3, 1),
    );
    const lastDayOfTargetMonth = new Date(
        Date.UTC(
            targetMonthStart.getUTCFullYear(),
            targetMonthStart.getUTCMonth() + 1,
            0,
        ),
    ).getUTCDate();

    targetMonthStart.setUTCDate(
        Math.min(date.getUTCDate(), lastDayOfTargetMonth),
    );

    return {
        today,
        endDate: targetMonthStart.toISOString().slice(0, 10),
    };
}
