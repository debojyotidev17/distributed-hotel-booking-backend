import type { Request, Response } from "express";
import type {
    CreateStateDto,
    StateIdDto,
    UpdateStateDto,
} from "../dtos/state.dto.js";
import {
    createStateService,
    deleteStateService,
    getAllStatesService,
    getStateByIdService,
    updateStateService,
} from "../services/state.service.js";

// creates a state or union territory
export async function createStateHandler(req: Request, res: Response) {
    const state = await createStateService(req.body as CreateStateDto);

    return res.status(201).json({
        success: true,
        message: "State created successfully",
        data: state,
    });
}

// gets all states and union territories
export async function getAllStatesHandler(_req: Request, res: Response) {
    const states = await getAllStatesService();

    return res.status(200).json({
        success: true,
        message: "States retrieved successfully",
        data: states,
    });
}

// gets a state or union territory by id
export async function getStateByIdHandler(req: Request, res: Response) {
    const state = await getStateByIdService(req.params.id as StateIdDto);

    return res.status(200).json({
        success: true,
        message: "State retrieved successfully",
        data: state,
    });
}

// updates a state or union territory
export async function updateStateHandler(req: Request, res: Response) {
    const state = await updateStateService(
        req.params.id as StateIdDto,
        req.body as UpdateStateDto,
    );

    return res.status(200).json({
        success: true,
        message: "State updated successfully",
        data: state,
    });
}

// deletes a state and dependent city and hotel records
export async function deleteStateHandler(req: Request, res: Response) {
    const deleted = await deleteStateService(req.params.id as StateIdDto);

    return res.status(200).json({
        success: true,
        message: "State deleted successfully",
        data: deleted,
    });
}