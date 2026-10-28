import type { Request, Response } from "express";

import type {
    CreateHotelDto,
    HotelIdDto,
    UpdateHotelDto,
} from "../dtos/hotel.dto.js";

import {
    createHotelService,
    deleteHotelService,
    getAllHotelsService,
    getHotelByIdService,
    updateHotelService,
} from "../services/hotel.service.js";

// creates a hotel and returns it with HTTP 201
export async function createHotelHandler(req: Request, res: Response) {
    const hotel = await createHotelService(req.body as CreateHotelDto);

    return res.status(201).json({
        success: true,
        message: "Hotel created successfully",
        data: hotel,
    });
}

// gets a hotel by id
export async function getHotelByIdHandler(req: Request, res: Response) {
    const hotel = await getHotelByIdService(req.params.id as HotelIdDto);

    return res.status(200).json({
        success: true,
        message: "Hotel retrieved successfully",
        data: hotel,
    });
}

// gets all hotels
export async function getAllHotelsHandler(_req: Request, res: Response) {
    const hotels = await getAllHotelsService();

    return res.status(200).json({
        success: true,
        message: "Hotels retrieved successfully",
        data: hotels,
    });
}

// updates a hotel
export async function updateHotelHandler(req: Request, res: Response) {
    const hotel = await updateHotelService(
        req.params.id as HotelIdDto,
        req.body as UpdateHotelDto,
    );

    return res.status(200).json({
        success: true,
        message: "Hotel updated successfully",
        data: hotel,
    });
}

// deletes a hotel
export async function deleteHotelHandler(req: Request, res: Response) {
    const result = await deleteHotelService(req.params.id as HotelIdDto);

    return res.status(200).json({
        success: true,
        message: "Hotel deleted successfully",
        data: result,
    });
}