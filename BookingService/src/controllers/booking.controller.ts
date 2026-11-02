import type { Request, Response } from "express";
import type { CreateDemoBookingRequestDTO } from "../dtos/create-demo-booking.dto.js";
import { createDemoBookingService } from "../services/booking.service.js";

export async function createDemoBookingController(req: Request, res: Response) {
    const params = req.body as CreateDemoBookingRequestDTO;

    const result = await createDemoBookingService(params);

    res.status(201).json({
        success: true,
        message: "Pending booking created successfully",
        data: result,
    });
}
