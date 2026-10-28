import type { Request, Response } from "express";
import type {
    CreatePhysicalRoomsDto,
    PhysicalRoomParamsDto,
} from "../dtos/physical-room.dto.js";
import {
    createPhysicalRoomsService,
    getPhysicalRoomsService,
} from "../services/physical-room.service.js";

// Lists the registered physical rooms for the selected category.
export async function getPhysicalRoomsHandler(req: Request, res: Response) {
    const rooms = await getPhysicalRoomsService(
        req.params as unknown as PhysicalRoomParamsDto,
    );

    return res.status(200).json({
        success: true,
        message: "Physical rooms retrieved successfully",
        data: rooms,
    });
}

// Registers physical room numbers for the selected category.
export async function createPhysicalRoomsHandler(req: Request, res: Response) {
    const rooms = await createPhysicalRoomsService(
        req.params as unknown as PhysicalRoomParamsDto,
        req.body as CreatePhysicalRoomsDto,
    );

    return res.status(201).json({
        success: true,
        message: "Physical rooms registered successfully",
        data: rooms,
    });
}