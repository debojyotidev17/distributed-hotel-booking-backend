import type { Request, Response } from "express";
import {
    createRoomHoldService,
    releaseRoomHoldService,
} from "../services/booking-hold.service.js";
import type {
    CreateRoomHoldDto,
    ReleaseRoomHoldParamsDTO,
} from "../dtos/booking-hold.dto.js";

export async function createRoomHoldController(req: Request, res: Response) {
    const params = req.body as CreateRoomHoldDto;

    const result = await createRoomHoldService(params);

    res.status(201).json({
        success: true,
        message: "Room hold created successfully",
        data: result,
    });
}

export async function releaseRoomHoldController(req: Request, res: Response) {
    const { bookingId } = req.params as ReleaseRoomHoldParamsDTO;

    const result = await releaseRoomHoldService(bookingId);

    res.status(200).json({
        success: true,
        message: "Room hold released successfully",
        data: result,
    });
}
