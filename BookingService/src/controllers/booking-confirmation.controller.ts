import type { Request, Response } from "express";
import { confirmBookingService } from "../services/booking-confirmation.service.js";

export async function confirmBookingController(req: Request, res: Response) {
    const { idempotencyKey } = req.params;

    const result = await confirmBookingService(idempotencyKey as string);

    res.status(200).json({
        success: true,
        message: "Booking confirmation processed",
        data: result,
    });
}
