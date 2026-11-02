export interface AppError extends Error {
    statusCode: number;
}

export class InternalServerError extends Error implements AppError {
    statusCode: number;

    constructor(message: string) {
        super(message);

        this.statusCode = 500;
        this.name = "Internal Server Error"; // JS default Error constructor only requires the message not the name
    }
}

export class NotFoundError extends Error implements AppError {
    statusCode: number;

    constructor(message: string) {
        super(message);

        this.statusCode = 404;
        this.name = "Not Found Error";
    }
}

export class BadRequestError extends Error implements AppError {
    statusCode: number;

    constructor(message: string) {
        super(message);

        this.statusCode = 400;
        this.name = "Bad Request from client";
    }
}

// Handles requests with missing or invalid authentication credentials.
export class UnauthorizedError extends Error {
    statusCode = 401;

    constructor(message: string) {
        super(message);
        this.name = "UnauthorizedError";
    }
}

// Handles authenticated users who lack the required permissions.
// The user is authenticated but does not have the required role
export class ForbiddenError extends Error {
    statusCode = 403;

    constructor(message: string) {
        super(message);
        this.name = "ForbiddenError";
    }
}

export class ConflictError extends Error implements AppError {
    statusCode: number;

    constructor(message: string) {
        super(message);

        this.statusCode = 409;
        this.name = "Conflict Error";
    }
}