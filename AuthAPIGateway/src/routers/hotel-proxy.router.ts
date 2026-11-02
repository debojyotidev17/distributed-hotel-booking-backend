import express from "express";
import type { Request } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

import { serverConfig } from "../config/server.config.js";
import { authenticateMiddleware } from "../middlewares/authenticate.middleware.js";
import { requireAllRoles } from "../middlewares/authorize-role.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const hotelProxyRouter = express.Router();

// Forwards requests to HotelService while keeping the client's path and body.
const hotelServiceProxy = createProxyMiddleware({
    target: serverConfig.HOTEL_SERVICE_URL,
    changeOrigin: true,

    // Use originalUrl because Express may shorten req.url inside nested routers.
    pathRewrite: (_path, req) => {
        // Remove the gateway-only (/hotels) prefix before forwarding to HotelService.
        return (
            (req as Request).originalUrl.replace(/^\/hotels(?=\/|$)/, "") || "/"
        );
    },

    // express.json() has already read the body, so restore it for the proxy.
    on: {
        proxyReq: fixRequestBody,
    },
});

// -------------------- States --------------------
// State information is public; only admins can manage it.
const stateProxyRouter = express.Router();

stateProxyRouter.get("/", hotelServiceProxy);
stateProxyRouter.get("/:id", hotelServiceProxy);

stateProxyRouter.post(
    "/",
    authenticateMiddleware,
    requireAllRoles("admin"),
    hotelServiceProxy,
);

stateProxyRouter.patch(
    "/:id",
    authenticateMiddleware,
    requireAllRoles("admin"),
    hotelServiceProxy,
);

stateProxyRouter.delete(
    "/:id",
    authenticateMiddleware,
    requireAllRoles("admin"),
    hotelServiceProxy,
);

// -------------------- Cities --------------------
// City information is public; only admins can manage it.
const cityProxyRouter = express.Router();

cityProxyRouter.get("/", hotelServiceProxy);
cityProxyRouter.get("/:id", hotelServiceProxy);

cityProxyRouter.post(
    "/",
    authenticateMiddleware,
    requireAllRoles("admin"),
    hotelServiceProxy,
);

cityProxyRouter.patch(
    "/:id",
    authenticateMiddleware,
    requireAllRoles("admin"),
    hotelServiceProxy,
);

cityProxyRouter.delete(
    "/:id",
    authenticateMiddleware,
    requireAllRoles("admin"),
    hotelServiceProxy,
);

// -------------------- Hotels --------------------
// Customers can browse hotels. Managing hotels requires the matching permission.
const hotelProxySubRouter = express.Router();

hotelProxySubRouter.get("/", hotelServiceProxy);
hotelProxySubRouter.get("/:id", hotelServiceProxy);

hotelProxySubRouter.post(
    "/",
    authenticateMiddleware,
    requirePermission("hotel:create"),
    hotelServiceProxy,
);

hotelProxySubRouter.patch(
    "/:id",
    authenticateMiddleware,
    requirePermission("hotel:update"),
    hotelServiceProxy,
);

hotelProxySubRouter.delete(
    "/:id",
    authenticateMiddleware,
    requirePermission("hotel:delete"),
    hotelServiceProxy,
);

// -------------------- Room Categories --------------------
// Category details can be public; changes require room-management permissions.
const roomCategoryProxyRouter = express.Router();

roomCategoryProxyRouter.get("/", hotelServiceProxy);
roomCategoryProxyRouter.get("/:id", hotelServiceProxy);

roomCategoryProxyRouter.post(
    "/",
    authenticateMiddleware,
    requirePermission("room:create"),
    hotelServiceProxy,
);

roomCategoryProxyRouter.patch(
    "/:id",
    authenticateMiddleware,
    requirePermission("room:update"),
    hotelServiceProxy,
);

roomCategoryProxyRouter.delete(
    "/:id",
    authenticateMiddleware,
    requirePermission("room:delete"),
    hotelServiceProxy,
);

// -------------------- Physical Rooms --------------------
// Individual room records are for authorized staff, not public browsing.
const physicalRoomProxyRouter = express.Router();

physicalRoomProxyRouter.get(
    "/",
    authenticateMiddleware,
    requirePermission("room:read"),
    hotelServiceProxy,
);

physicalRoomProxyRouter.post(
    "/",
    authenticateMiddleware,
    requirePermission("room:create"),
    hotelServiceProxy,
);

// -------------------- Availability Periods --------------------
// Customers can view availability periods; creating them is staff-only.
const availabilityPeriodProxyRouter = express.Router();

availabilityPeriodProxyRouter.get("/", hotelServiceProxy);

availabilityPeriodProxyRouter.post(
    "/",
    authenticateMiddleware,
    requirePermission("availability:create"),
    hotelServiceProxy,
);

// -------------------- Mount nested routers --------------------
// These are the paths clients call on the gateway.
// The proxy removes the outer /hotels prefix before forwarding.
hotelProxyRouter.use("/states", stateProxyRouter);
hotelProxyRouter.use("/cities", cityProxyRouter);
hotelProxyRouter.use("/hotels", hotelProxySubRouter);

hotelProxyRouter.use(
    "/hotels/:hotelId/room-categories",
    roomCategoryProxyRouter,
);

// Physical rooms and availability periods are nested under room categories.
roomCategoryProxyRouter.use(
    "/:roomCategoryId/physical-rooms",
    physicalRoomProxyRouter,
);

roomCategoryProxyRouter.use(
    "/:roomCategoryId/availability-periods",
    availabilityPeriodProxyRouter,
);

export default hotelProxyRouter;
