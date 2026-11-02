import type { Request, Response } from "express";
import type {
    CityIdDto,
    CreateCityDto,
    ListCitiesQueryDto,
    UpdateCityDto,
} from "../dtos/city.dto.js";
import {
    createCityService,
    deleteCityService,
    getAllCitiesService,
    getCityByIdService,
    updateCityService,
} from "../services/city.service.js";

// Creates a city and returns it with HTTP 201.
export async function createCityHandler(req: Request, res: Response) {
    const city = await createCityService(req.body as CreateCityDto);

    return res.status(201).json({
        success: true,
        message: "City created successfully",
        data: city,
    });
}

// Lists cities, optionally filtered by state ID.
export async function getAllCitiesHandler(req: Request, res: Response) {
    const cities = await getAllCitiesService(req.query as ListCitiesQueryDto);

    return res.status(200).json({
        success: true,
        message: "Cities retrieved successfully",
        data: cities,
    });
}

// Retrieves one city by its validated UUID.
export async function getCityByIdHandler(req: Request, res: Response) {
    const city = await getCityByIdService(req.params.id as CityIdDto);

    return res.status(200).json({
        success: true,
        message: "City retrieved successfully",
        data: city,
    });
}

// Updates a city with validated fields.
export async function updateCityHandler(req: Request, res: Response) {
    const city = await updateCityService(
        req.params.id as CityIdDto,
        req.body as UpdateCityDto,
    );

    return res.status(200).json({
        success: true,
        message: "City updated successfully",
        data: city,
    });
}

// Deletes a city and dependent hotels through cascade deletion.
export async function deleteCityHandler(req: Request, res: Response) {
    const deleted = await deleteCityService(req.params.id as CityIdDto);

    return res.status(200).json({
        success: true,
        message: "City deleted successfully",
        data: deleted,
    });
}
