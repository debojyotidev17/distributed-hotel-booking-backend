import type { Request, Response } from "express";
import type {
    AvailabilityCategoryParamsDto,
    CreateAvailabilityPeriodsDto,
} from "../dtos/availability-period.dto.js";
import {
    createAvailabilityPeriodsService,
    getAvailabilityPeriodsService,
} from "../services/availability-period.service.js";

// Lists the periods saved for this hotel category.
export async function getAvailabilityPeriodsHandler(
    req: Request,
    res: Response,
) {
    const periods = await getAvailabilityPeriodsService(
        req.params as unknown as AvailabilityCategoryParamsDto,
    );

    return res.status(200).json({
        success: true,
        message: "Availability periods retrieved successfully",
        data: periods,
    });
}

// Saves periods for this hotel category and queues generation where dates are in the booking window.
export async function createAvailabilityPeriodsHandler(
    req: Request,
    res: Response,
) {
    const result = await createAvailabilityPeriodsService(
        req.params as unknown as AvailabilityCategoryParamsDto,
        req.body as CreateAvailabilityPeriodsDto,
    );

    return res.status(201).json({
        success: true,
        message: "Availability periods created successfully",
        data: result,
    });
}
