# Distributed Hotel Booking Backend

## Overview

**A distributed reservation engine built around a hard backend invariant: the same physical room must not be reserved for overlapping nights by competing requests.** It tracks inventory per physical room and date, creates a time-limited hold, and coordinates confirmation across independently owned services and databases. Its data model spans three PostgreSQL domains: identity and RBAC, location-to-room-night inventory, and bookings with idempotency state.

A client request enters the reverse proxy; protected routes pass JWT and role/permission checks. BookingService and HotelService coordinate a room hold using Redis Redlock and PostgreSQL pessimistic row locks, then BookingService commits pending state with an idempotency key. Schedulers maintain the booking window and expire abandoned holds. BullMQ carries availability-generation and email work outside the request path.

The result is a hands-on distributed-systems backend that brings together microservice ownership, reverse proxying, PostgreSQL transactions, transaction isolation, distributed locks, row-level pessimistic locking, uniqueness constraints, idempotency, compensating actions, background jobs, cron scheduling, RBAC, and asynchronous email delivery.

## Why this is more than a CRUD API

- **A real inventory invariant.** Availability is represented at `physical room × date` granularity, so every night of a stay is resolved against the exact physical rooms requested.
- **Layered concurrency control.** Redis Redlock coordinates competing HotelService instances for each room/date key; PostgreSQL row locks and a transaction recheck and reserve the actual rows.
- **Safe booking orchestration across services.** BookingService creates the booking UUID first, passes it to HotelService for the hold, and persists the pending booking and confirmation key together. A failed booking write triggers a compensating hold release.
- **Repeat-safe confirmation.** A unique idempotency key plus row locks ensures concurrent confirmations are serialized and repeat requests observe the finalized result.
- **Server-owned pricing.** BookingService calculates the total from HotelService’s category price, room count, and nights; the client cannot submit a trusted total.
- **Time-bounded inventory.** A ten-minute hold gives the customer a confirmation window, while the expiry scheduler cancels expired pending bookings and releases their room-night reservations.
- **Rolling availability generation.** An India-time daily cron expands saved periods into room-night inventory for the current three-calendar-month window. BullMQ retries generation jobs, while unique room/date keys make generation idempotent.
- **Asynchronous notification delivery.** A confirmed booking queues an email job for a separate NotificationService worker, keeping SMTP work away from the confirmation request.

The services own separate databases and coordinate through their APIs, Redis-backed locks and queues, and a compensating hold release. Each service applies local database transactions to the state it owns.

## Services and infrastructure

| Component | Responsibility | Local port / connection |
| --- | --- | --- |
| AuthAPIGateway | Signup, login, profile, roles, permissions, and gateway proxying | HTTP `3000`; PostgreSQL `5433` |
| HotelService | States, cities, hotels, categories, physical rooms, availability periods, room-night generation, and booking holds | HTTP `3001`; PostgreSQL `5434`; Redis `6380` |
| BookingService | Pending booking creation, confirmation, idempotency, expiry, and notification-job production | HTTP `3002`; PostgreSQL `5435`; Redis `6381` |
| NotificationService | BullMQ worker that sends booking-confirmation email | Background worker using Redis `6381` and SMTP |
| PostgreSQL | Three service-owned databases | Auth `authDB`, Hotel `hotelDB`, Booking `bookingDB` |
| Redis | Hotel availability-generation queue/locks and Booking notification queue | Hotel Redis `6380`; Booking/Notification Redis `6381` |

The port values above are the local mappings in the service Compose files and the local Postman environment. Runtime service URLs and credentials are configured through each service’s environment.

## Architecture

```mermaid
flowchart LR
    Client[Postman or client] --> Gateway[AuthAPIGateway :3000]
    Gateway --> AuthDB[(Auth PostgreSQL<br/>authDB)]
    Gateway -->|/hotels routes| Hotel[HotelService :3001]
    Gateway -->|/bookings routes| Booking[BookingService :3002]
    Hotel --> HotelDB[(Hotel PostgreSQL<br/>hotelDB)]
    Booking --> BookingDB[(Booking PostgreSQL<br/>bookingDB)]
    Booking -->|POST /booking-holds<br/>DELETE /booking-holds/:bookingId| Hotel
    Hotel --> HotelRedis[(Hotel Redis :6380<br/>room-generation queue<br/>Redlock)]
    HotelScheduler[Availability scheduler] --> HotelRedis
    HotelWorker[Room-generation worker] --> HotelRedis
    HotelWorker --> HotelDB
    Booking --> BookingRedis[(Booking Redis :6381<br/>booking-notifications)]
    Notify[NotificationService worker] --> BookingRedis
    Notify --> SMTP[SMTP server]
```

AuthAPIGateway handles its own auth and role routes, then proxies hotel and booking requests. NotificationService has no REST API; it listens to the `booking-notifications` BullMQ queue.

## Database ownership and relationships

Each service accesses its own PostgreSQL database. Each database declares foreign keys for the tables it owns; UUID relationships that cross service boundaries are **logical references coordinated by API calls**.

### Auth database

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : receives
    ROLES ||--o{ USER_ROLES : assigned_to
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : included_in

    USERS {
        uuid id PK
        varchar username
        varchar email UK
        varchar password "bcrypt hash"
        timestamptz created_at
        timestamptz updated_at
    }
    ROLES {
        uuid id PK
        varchar name UK
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    PERMISSIONS {
        uuid id PK
        varchar name UK
        text description
        varchar resource
        varchar action
        timestamptz created_at
        timestamptz updated_at
    }
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    ROLE_PERMISSIONS {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
        timestamptz created_at
        timestamptz updated_at
    }
```

`user_roles` has a unique `(user_id, role_id)` pair. `role_permissions` has a unique `(role_id, permission_id)` pair. Deleting a user, role, or permission cascades to its assignment rows.

### Hotel database

```mermaid
erDiagram
    STATES ||--o{ CITIES : contains
    CITIES ||--o{ HOTELS : contains
    HOTELS ||--o{ ROOM_CATEGORIES : offers
    ROOM_CATEGORIES ||--o{ PHYSICAL_ROOMS : contains
    ROOM_CATEGORIES ||--o{ AVAILABILITY_PERIODS : defines
    PHYSICAL_ROOMS ||--o{ ROOM_AVAILABILITY : has_by_date

    STATES {
        uuid id PK
        varchar name UK
        varchar code UK
        enum type "STATE or UNION_TERRITORY"
        timestamp created_at
        timestamp updated_at
    }
    CITIES {
        uuid id PK
        varchar name
        uuid state_id FK
        timestamp created_at
        timestamp updated_at
    }
    HOTELS {
        uuid id PK
        varchar name
        text address
        uuid city_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    ROOM_CATEGORIES {
        uuid id PK
        uuid hotel_id FK
        enum room_type
        integer price
        timestamptz created_at
        timestamptz updated_at
    }
    PHYSICAL_ROOMS {
        uuid id PK
        uuid room_category_id FK
        varchar room_number
        timestamptz created_at
        timestamptz updated_at
    }
    AVAILABILITY_PERIODS {
        uuid id PK
        uuid room_category_id FK
        date start_date
        date end_date "exclusive"
        integer rooms_per_night
        timestamptz created_at
        timestamptz updated_at
    }
    ROOM_AVAILABILITY {
        uuid id PK
        uuid physical_room_id FK
        date date_of_availability
        integer price
        uuid booking_id "logical reference to Booking DB; no FK"
        timestamptz created_at
        timestamptz updated_at
    }
```

Important constraints include unique state names and codes, unique city name within a state, unique hotel `(city_id, name, address)`, unique room type per hotel, unique room number per category, and unique `(physical_room_id, date_of_availability)` availability rows. Availability-period dates must satisfy `start_date < end_date`, and `rooms_per_night` and prices must be positive.

`room_availability` is the reservation-level inventory table. A row represents one physical room for one night. `booking_id` is nullable: `NULL` means the date is not held; a booking UUID means that room-night is held by that booking.

### Booking database

```mermaid
erDiagram
    BOOKINGS ||--|| IDEMPOTENCY_KEYS : confirmed_with

    BOOKINGS {
        uuid id PK
        uuid hotel_id "logical reference to Hotel DB"
        uuid room_category_id "logical reference to Hotel DB"
        varchar customer_email
        date check_in
        date check_out "exclusive"
        integer room_count
        integer booking_amount
        enum status "PENDING, CONFIRMED, CANCELLED"
        timestamptz hold_expires_at
        timestamptz created_at
        timestamptz updated_at
    }
    IDEMPOTENCY_KEYS {
        uuid id PK
        uuid idempotency_key UK
        uuid booking_id FK
        enum status "ACTIVE, FINALIZED, EXPIRED"
        timestamptz created_at
        timestamptz updated_at
    }
```

Each booking has one idempotency-key row. The key and `booking_id` are individually unique. `hotel_id` and `room_category_id` hold HotelService UUIDs. The booking domain stores `customer_email` as the notification destination, while identity and user records remain owned by AuthAPIGateway.

### Cross-database references

```mermaid
flowchart LR
    subgraph HotelDB[Hotel PostgreSQL]
        H[hotels.id]
        C[room_categories.id]
        PA[room_availability.booking_id]
    end
    subgraph BookingDB[Booking PostgreSQL]
        BH[bookings.hotel_id]
        BC[bookings.room_category_id]
        BID[bookings.id]
    end
    BH -. "same hotel UUID" .-> H
    BC -. "same category UUID" .-> C
    PA -. "held by booking UUID" .-> BID
```

The dotted links above are application-level references. BookingService calls HotelService to create or release a hold; neither PostgreSQL database can enforce a foreign key into the other database.

## Booking lifecycle and concurrency control

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Gateway as AuthAPIGateway
    participant Booking as BookingService
    participant BDB as Booking PostgreSQL
    participant Hotel as HotelService
    participant HDB as Hotel PostgreSQL
    participant Redis as Hotel Redis Redlock
    participant Queue as Booking Redis BullMQ
    participant Mailer as NotificationService

    Customer->>Gateway: POST /bookings (hotel, category, dates, roomCount)
    Gateway->>Booking: Proxy after JWT + booking:create check
    Booking->>Booking: Generate booking UUID
    Booking->>Hotel: POST /booking-holds (booking UUID and requested room-nights)
    Hotel->>HDB: Find physical rooms available for every night
    Hotel->>Redis: Acquire room:{physicalRoomId}:{date} locks (5 seconds)
    Hotel->>HDB: Transaction: SELECT rows FOR UPDATE, recheck, set booking_id
    Hotel-->>Booking: Held room IDs and current category price
    Booking->>Booking: Calculate price = price/night × roomCount × nights
    Booking->>BDB: One transaction: insert PENDING booking + ACTIVE idempotency key
    Booking-->>Customer: Booking ID, idempotency key, amount, hold expiry

    Customer->>Gateway: POST /bookings/{idempotencyKey}/confirm
    Gateway->>Booking: Proxy after JWT + booking:create check
    Booking->>BDB: Transaction locks idempotency key and booking rows
    Booking->>BDB: Set booking CONFIRMED and key FINALIZED
    Booking->>Queue: Queue booking-confirmation email job
    Booking-->>Customer: outcome CONFIRMED
    Queue-->>Mailer: Worker consumes email job
    Mailer->>Mailer: Render Handlebars template and send through SMTP

```

If saving the booking and idempotency key fails after HotelService has created the hold, BookingService requests a compensating release. During confirmation, BookingService locks the idempotency-key row and booking row. Repeated confirmations return `ALREADY_FINALIZED`; the email job is queued only when the booking is newly confirmed.

### How a hold prevents double booking

1. The customer requests a room category, date range, and room count. `checkOut` is exclusive, so a stay from `2026-11-10` to `2026-11-12` covers the nights of November 10 and 11.
2. BookingService generates the booking UUID before contacting HotelService. HotelService uses that UUID to mark held room-night rows.
3. HotelService finds physical rooms in the requested category with an unassigned availability row for **every** requested night. The candidate search identifies possible rooms; the locked transaction makes the final availability decision.
4. HotelService acquires Redlock resources for every selected room/date. The lock TTL is 5 seconds and the Redlock client has no retry wait (`retryCount: 0`). This lock lifetime is separate from the 10-minute booking hold.
5. Inside a database transaction, HotelService locks the matching rows with `SELECT ... FOR UPDATE`, checks every selected room still has every night, and updates the rows with `booking_id`. If any room-night changed, it reserves none and returns a conflict.
6. After HotelService returns the hold and current category price, BookingService computes `bookingAmount = pricePerNight × roomCount × nights`. The customer cannot provide the amount.
7. BookingService writes the pending booking and its active idempotency key in one Booking DB transaction. If that transaction fails, it calls HotelService to release the hold.
8. The booking hold lasts 10 minutes. A confirmation after expiry cannot confirm it; the hold is released.

### Transaction isolation and locking

The services use Drizzle PostgreSQL transactions. With the local PostgreSQL 18 Compose setup, transactions use PostgreSQL’s default **READ COMMITTED** isolation level. Each statement sees data committed before that statement begins. The candidate search is preliminary; the reservation transaction performs a fresh availability check while locking the matching rows. See the [PostgreSQL transaction isolation documentation](https://www.postgresql.org/docs/18/transaction-iso.html).

The reservation path layers distinct locks around the same inventory invariant:

1. **Redis Redlock, distributed across HotelService instances.** HotelService builds a lock resource for every selected `physicalRoomId` and date, for example `room:<room UUID>:2026-11-10`. It acquires all resources with a 5-second TTL. Redlock is configured with `retryCount: 0`, so a lock collision returns promptly as a conflict.
2. **PostgreSQL `SELECT ... FOR UPDATE`, pessimistic row locking.** After Redlock acquisition, a PostgreSQL transaction locks the still-unassigned room-night rows. HotelService verifies that every selected room still has every night, then sets the booking UUID on all of them in the same transaction.
3. **Database uniqueness as an integrity backstop.** The unique `(physical_room_id, date_of_availability)` key prevents duplicate inventory rows for one room-night. Availability generation uses `ON CONFLICT DO NOTHING`, so retried generation jobs cannot duplicate those rows.
4. **Booking confirmation row locks.** BookingService locks the idempotency-key row and the related booking row before checking expiry or changing status. The unique key constraint ensures a confirmation key maps to one booking, and serialized repeat requests return the already-finalized outcome.

The 5-second Redlock TTL protects the short critical section around claiming room-night rows. It is separate from the 10-minute customer hold stored as `hold_expires_at`.

## Availability periods, queues, and schedulers

Availability periods are owner-defined rules for a room category:

- A period uses `[startDate, endDate)`; the end date is not a bookable night in that period.
- `roomsPerNight` must be a positive integer and cannot exceed the registered physical rooms in that category.
- Periods cannot start in the past, overlap another period in the same request, or overlap a saved period for that category.
- Only dates within the current three-calendar-month booking window are generated.

When a period is saved, HotelService queues a room-generation job for the part of the period that is currently bookable. On service startup, the availability scheduler runs once immediately. It then runs every day at **00:10 Asia/Kolkata** and queues newly eligible ranges as the booking window advances.

The `room-generation` BullMQ worker runs with concurrency 1 and retries a failed job up to three attempts with exponential backoff starting at two seconds. It loads the saved period, category, and physical rooms; chooses the first `roomsPerNight` registered rooms in room-number order; and inserts one availability row per selected room per date. The `(physical_room_id, date_of_availability)` unique constraint plus `ON CONFLICT DO NOTHING` makes repeated generation idempotent.

BookingService runs a separate expiry scheduler every 60 seconds. It finds pending bookings whose `hold_expires_at` has passed, marks each booking `CANCELLED`, marks its idempotency key `EXPIRED`, and asks HotelService to clear the booking ID from the held room-night rows.

## Notification flow

BookingService queues a `booking-confirmation` job only when a booking changes to `CONFIRMED`. The queue is named `booking-notifications` and uses the Booking Redis instance. NotificationService consumes the job, renders `src/templates/mailer/booking-confirmation.hbs`, and sends it using Nodemailer with the SMTP environment settings.

The notification job has three attempts with exponential backoff starting at two seconds. Email delivery is asynchronous: the booking confirmation API can return success while the email is still being processed. If queue publication fails, the booking remains confirmed and BookingService logs the queue error. NotificationService logs `Notification email sent` on success and `Notification job failed` on delivery failure.

## Project structure

```text
.
├── AuthAPIGateway/
│   ├── src/
│   │   ├── config/             # Server config and logging
│   │   ├── controllers/        # Auth, profile, role, permission handlers
│   │   ├── middlewares/        # JWT, role, permission, correlation, errors
│   │   ├── models/schemas/     # users, roles, permissions, join tables
│   │   ├── repositories/       # Auth database access
│   │   ├── routers/            # Auth routes and Hotel/Booking proxies
│   │   ├── seeders/            # Roles, permissions, assignments
│   │   ├── services/           # Auth and access-control use cases
│   │   └── validators/         # Zod request schemas
│   ├── drizzle/                # Auth migrations
│   └── docker-compose.yml      # Auth PostgreSQL
├── HotelService/
│   ├── src/
│   │   ├── config/             # PostgreSQL, Redis, Redlock, logging
│   │   ├── controllers/        # Hotel inventory and hold handlers
│   │   ├── models/schemas/     # Hotel-owned tables
│   │   ├── processors/         # Room-generation worker
│   │   ├── producers/          # Room-generation job producer
│   │   ├── queues/             # BullMQ queue configuration
│   │   ├── repositories/       # Hotel database access
│   │   ├── routers/            # Hotel and internal hold routes
│   │   ├── schedulers/         # Booking-window availability scheduler
│   │   ├── seeders/            # Sample hotel inventory
│   │   ├── services/           # Inventory, generation, and holds
│   │   └── validators/         # Zod request schemas
│   ├── drizzle/                # Hotel migrations
│   └── docker-compose.yml      # Hotel PostgreSQL and Redis
├── BookingService/
│   ├── src/
│   │   ├── apis/               # Internal HotelService HTTP client
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/schemas/     # bookings and idempotency keys
│   │   ├── producers/          # Booking notification producer
│   │   ├── queues/             # BullMQ queue configuration
│   │   ├── repositories/       # Booking database transactions
│   │   ├── routers/
│   │   ├── schedulers/         # Pending-booking expiry interval
│   │   ├── services/
│   │   └── validators/
│   ├── drizzle/                # Booking migrations
│   └── docker-compose.yml      # Booking PostgreSQL and Redis
├── NotificationService/
│   ├── src/
│   │   ├── config/             # Redis and logging
│   │   ├── processors/         # Booking-email worker
│   │   ├── services/           # Nodemailer transport
│   │   └── templates/mailer/   # Handlebars email template
│   └── package.json
└── postman/
    ├── collections/
    └── environments/
```

Each service has its own `package.json`, lockfile, TypeScript config, and `.env` file. Dependencies and commands are run inside the service package they belong to.

## Local setup

### Requirements

- Node.js with support for `node --watch`, npm, and Docker Compose.
- SMTP account settings for actual booking-confirmation email delivery.

### Start the databases and Redis

Run from the repository root:

```bash
docker compose -f AuthAPIGateway/docker-compose.yml up -d
docker compose -f HotelService/docker-compose.yml up -d
docker compose -f BookingService/docker-compose.yml up -d
```

The Compose files create the local services on these host ports:

| Service | Host port | Container port |
| --- | ---: | ---: |
| Auth PostgreSQL | 5433 | 5432 |
| Hotel PostgreSQL | 5434 | 5432 |
| Hotel Redis | 6380 | 6379 |
| Booking PostgreSQL | 5435 | 5432 |
| Booking/Notification Redis | 6381 | 6379 |

The Compose files define local development database names and credentials. Keep these development credentials out of production deployments.

### Environment variables

Create a `.env` file in each service directory. The services read environment settings from their own working directory.

| Service | Required settings |
| --- | --- |
| AuthAPIGateway | `PORT`, `DATABASE_URL`, `JWT_SECRET`, `HOTEL_SERVICE_URL`, `BOOKING_SERVICE_URL` |
| HotelService | `PORT`, `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT` |
| BookingService | `PORT`, `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `HOTEL_SERVICE_URL` |
| NotificationService | `REDIS_HOST`, `REDIS_PORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |

Local examples based on the Compose port mappings (replace the JWT and SMTP values with your own):

```dotenv
# AuthAPIGateway/.env
PORT=3000
DATABASE_URL=postgresql://postgres:admin@127.0.0.1:5433/authDB
JWT_SECRET=replace-with-a-local-secret
HOTEL_SERVICE_URL=http://localhost:3001
BOOKING_SERVICE_URL=http://localhost:3002
```

```dotenv
# HotelService/.env
PORT=3001
DATABASE_URL=postgresql://localhost:admin@127.0.0.1:5434/hotelDB
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
```

```dotenv
# BookingService/.env
PORT=3002
DATABASE_URL=postgresql://localhost:admin@127.0.0.1:5435/bookingDB
REDIS_HOST=127.0.0.1
REDIS_PORT=6381
HOTEL_SERVICE_URL=http://localhost:3001
```

```dotenv
# NotificationService/.env
REDIS_HOST=127.0.0.1
REDIS_PORT=6381
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=your-sender-address
```

`NotificationService` runs as a BullMQ background worker using Redis and SMTP.

### Install dependencies, migrate, and seed

Run commands from each service directory:

```bash
cd AuthAPIGateway
npm install
npm run db:migrate
npm run db:seed
```

```bash
cd HotelService
npm install
npx drizzle-kit migrate
npm run db:seed
```

```bash
cd BookingService
npm install
npx drizzle-kit migrate
```

```bash
cd NotificationService
npm install
```

AuthAPIGateway’s seeder creates the `customer`, `hotel_manager`, and `admin` roles, permissions, and role-permission assignments. Signup assigns the `customer` role to a new account. The HotelService seeder loads the location and inventory hierarchy; availability periods drive room-night generation through the availability workflow.

### Start the services

Run each service in a separate terminal from its directory:

```bash
cd AuthAPIGateway && npm start
```

```bash
cd HotelService && npm start
```

```bash
cd BookingService && npm start
```

```bash
cd NotificationService && npm start
```

Each `start` script runs TypeScript compilation and then starts `dist/server.js` in Node watch mode. HotelService starts its availability scheduler and room-generation worker. BookingService starts the pending-booking expiry interval. NotificationService starts the booking-email worker.

## Seeded local data

The HotelService seeder inserts states, cities, hotels, categories, and rooms idempotently. It currently seeds:

| State | City | Hotel | Room categories and nightly prices |
| --- | --- | --- | --- |
| Bihar | Patna | Ganga View Hotel | DOUBLE ₹3,500; DELUXE ₹5,500 |
| Bihar | Gaya | Bodh Heritage Hotel | DOUBLE ₹3,000; SUITE ₹6,500 |
| Maharashtra | Mumbai | Harbour View Residency | DOUBLE ₹6,000; DELUXE ₹9,000 |
| Maharashtra | Pune | Sahyadri Suites | DOUBLE ₹4,500; SUITE ₹7,500 |
| Karnataka | Bengaluru | Garden City Hotel | DOUBLE ₹5,000; DELUXE ₹8,000 |

Each listed room category is seeded with two physical room numbers. The availability-period workflow generates availability rows for each category. Booking holds use those generated room-night rows for each requested date.

Room types accepted by HotelService are `SINGLE`, `DOUBLE`, `FAMILY`, `DELUXE`, and `SUITE`. State types are `STATE` and `UNION_TERRITORY`.

## Authentication and access control

- Signup validates username (3–50 characters), email, and password (8–100 characters). The email is normalized to lowercase, the password is bcrypt-hashed, and the new user receives the seeded `customer` role in the same database transaction. The response never includes the password hash.
- Login validates email and password, compares the password with the stored bcrypt hash, and returns a JWT access token that expires after one hour. The token carries the `userId` claim.
- Protected requests use `Authorization: Bearer <accessToken>`.
- Role and permission checks read the Auth database. The token itself does not contain the role-permission matrix.
- Signup assigns the default `customer` role. Administrative and inventory operations are protected by the seeded role and permission checks.

The seeded role-to-permission assignments are:

| Role | Permissions |
| --- | --- |
| `customer` | `booking:create`, `booking:read`, `booking:cancel` |
| `hotel_manager` | `hotel:read`, `hotel:update`, `room:create`, `room:read`, `room:update`, `room:delete`, `availability:create`, `booking:read` |
| `admin` | Every seeded permission |

## API conventions and errors

- JSON request bodies use `Content-Type: application/json`.
- Successful responses use `{ "success": true, "message": "...", "data": ... }`. Some delete or action responses omit `data` when there is no returned record.
- Errors use `{ "success": false, "message": "..." }`.
- Invalid Zod request bodies are returned as HTTP 400 with the generic message `Invalid req body`.
- Common status codes are `400` invalid input or unavailable inventory, `401` missing/invalid/expired token, `403` missing role or permission, `404` missing record, `409` duplicate or concurrent conflict, and `500` unexpected server error.
- Nested hotel inventory routes include both the gateway mount prefix and the HotelService `/hotels` path segment. For example, the gateway URL for room categories is `/hotels/hotels/:hotelId/room-categories`; the first `/hotels` is the gateway mount and is stripped before forwarding.

## HTTP route catalog

`{{gatewayUrl}}` is `http://localhost:3000` in the Postman environment. Unless stated otherwise, gateway routes below are the public client routes. Protected routes use a bearer JWT plus the listed role or permission.

### Auth and profile — AuthAPIGateway

| Method | Gateway path | Access | Purpose | Success response message |
| --- | --- | --- | --- | --- |
| POST | `/auth/signup` | Public | Create a customer account | `201` — `User registered successfully` |
| POST | `/auth/login` | Public | Verify credentials and issue a one-hour access token | `200` — `User logged in successfully` |
| GET | `/auth/profile` | Bearer token; customer, hotel_manager, or admin | Return the authenticated user profile | `200` — `Profile fetched successfully` |

### Roles and permissions — AuthAPIGateway

All routes in this group require a bearer token and the `admin` role.

| Method | Gateway path | Purpose | Success response message |
| --- | --- | --- | --- |
| POST | `/roles` | Create a role | `201` — `Role created successfully` |
| GET | `/roles` | List roles | `200` — `Roles fetched successfully` |
| GET | `/roles/:id` | Fetch one role | `200` — `Role fetched successfully` |
| PUT | `/roles/:id` | Replace role name and description | `200` — `Role updated successfully` |
| DELETE | `/roles/:id` | Delete a role | `200` — `Role deleted successfully` |
| POST | `/roles/:userId/assign/:roleId` | Assign an existing role to an existing user | `200` — `Role assigned to user successfully` |
| GET | `/roles/:id/permissions` | List permissions assigned to a role | `200` — `Role permissions fetched successfully` |
| POST | `/roles/:id/permissions` | Assign a permission to a role | `201` — `Permission assigned to role successfully` |
| DELETE | `/roles/:id/permissions` | Remove a permission assignment; permission ID is in the JSON body | `200` — `Permission removed from role successfully` |
| GET | `/roles/role-permissions` | List all role-permission assignments | `200` — `All role permissions fetched successfully` |

### States and cities — gateway paths proxied to HotelService

State and city reads are public. Create, update, and delete require an authenticated admin.

| Method | Gateway path | Purpose | Success response message |
| --- | --- | --- | --- |
| GET | `/hotels/states` | List states and union territories | `200` — `States retrieved successfully` |
| GET | `/hotels/states/:id` | Fetch a state by UUID | `200` — `State retrieved successfully` |
| POST | `/hotels/states` | Create a state or union territory | `201` — `State created successfully` |
| PATCH | `/hotels/states/:id` | Change one or more state fields | `200` — `State updated successfully` |
| DELETE | `/hotels/states/:id` | Delete a state; cascades to its cities and dependent hotel inventory | `200` — `State deleted successfully` |
| GET | `/hotels/cities` | List all cities | `200` — `Cities retrieved successfully` |
| GET | `/hotels/cities?stateId=:stateId` | List cities in one state | `200` — `Cities retrieved successfully` |
| GET | `/hotels/cities/:id` | Fetch a city by UUID | `200` — `City retrieved successfully` |
| POST | `/hotels/cities` | Create a city in an existing state | `201` — `City created successfully` |
| PATCH | `/hotels/cities/:id` | Change the name and/or parent state | `200` — `City updated successfully` |
| DELETE | `/hotels/cities/:id` | Delete a city and dependent hotel inventory | `200` — `City deleted successfully` |

### Hotels and inventory — gateway paths proxied to HotelService

Hotel and room-category reads are public. Mutations require the permission shown. Physical-room records are staff-restricted. Availability-period reads are public.

| Method | Gateway path | Access | Purpose | Success response message |
| --- | --- | --- | --- | --- |
| GET | `/hotels/hotels` | Public | List hotels | `200` — `Hotels retrieved successfully` |
| GET | `/hotels/hotels/:id` | Public | Fetch one hotel | `200` — `Hotel retrieved successfully` |
| POST | `/hotels/hotels` | `hotel:create` | Create a hotel by resolving `cityName` and `stateName` | `201` — `Hotel created successfully` |
| PATCH | `/hotels/hotels/:id` | `hotel:update` | Update hotel fields and/or resolve a new city | `200` — `Hotel updated successfully` |
| DELETE | `/hotels/hotels/:id` | `hotel:delete` | Permanently delete a hotel and dependent inventory | `200` — `Hotel deleted successfully` |
| GET | `/hotels/hotels/:hotelId/room-categories` | Public | List a hotel’s room categories | `200` — `Room categories retrieved successfully` |
| POST | `/hotels/hotels/:hotelId/room-categories` | `room:create` | Add a room category | `201` — `Room category created successfully` |
| GET | `/hotels/hotels/:hotelId/room-categories/:roomCategoryId` | Public | Fetch a category only if it belongs to the hotel | `200` — `Room category retrieved successfully` |
| PATCH | `/hotels/hotels/:hotelId/room-categories/:roomCategoryId` | `room:update` | Update category room type and/or price | `200` — `Room category updated successfully` |
| DELETE | `/hotels/hotels/:hotelId/room-categories/:roomCategoryId` | `room:delete` | Permanently delete category and dependent inventory | `200` — `Room category deleted successfully` |
| GET | `/hotels/hotels/:hotelId/room-categories/:roomCategoryId/physical-rooms` | `room:read` | List physical rooms in a category | `200` — `Physical rooms retrieved successfully` |
| POST | `/hotels/hotels/:hotelId/room-categories/:roomCategoryId/physical-rooms` | `room:create` | Register room numbers in a category | `201` — `Physical rooms registered successfully` |
| GET | `/hotels/hotels/:hotelId/room-categories/:roomCategoryId/availability-periods` | Public | List saved availability periods | `200` — `Availability periods retrieved successfully` |
| POST | `/hotels/hotels/:hotelId/room-categories/:roomCategoryId/availability-periods` | `availability:create` | Save periods and queue availability generation | `201` — `Availability periods created successfully` |

Mutating routes require a bearer token as well as the listed permission. `GET physical-rooms` also requires a bearer token with `room:read`. Availability-period creation feeds the internal room-night selection used during booking holds.

### Booking — gateway proxy to BookingService

Both routes require a bearer token with `booking:create`.

| Method | Gateway path | Purpose | Success response message |
| --- | --- | --- | --- |
| POST | `/bookings` | Hold inventory, calculate amount, and create pending booking plus idempotency key | `201` — `Pending booking created successfully` |
| POST | `/bookings/:idempotencyKey/confirm` | Lock and confirm the pending booking, then queue email notification | `200` — `Booking confirmation processed` |

### Internal service routes

The following direct paths are addressed at each service’s base URL. BookingService calls HotelService’s hold endpoints directly; direct state and city lookups are also exposed through the gateway routes above. Direct BookingService paths are available for local integration checks.

| Service | Method | Direct path | Request / purpose | Success response message |
| --- | --- | --- | --- | --- |
| HotelService | GET | `/states/:id` | Direct state lookup | `200` — `State retrieved successfully` |
| HotelService | GET | `/cities/:id` | Direct city lookup | `200` — `City retrieved successfully` |
| HotelService | POST | `/booking-holds` | Internal room hold request from BookingService | `201` — `Room hold created successfully` |
| HotelService | DELETE | `/booking-holds/:bookingId` | Release every room-night held by a booking UUID | `200` — `Room hold released successfully` |
| BookingService | POST | `/bookings` | Direct pending-booking integration check | `201` — `Pending booking created successfully` |
| BookingService | POST | `/bookings/:idempotencyKey/confirm` | Direct confirmation integration check | `200` — `Booking confirmation processed` |

The normal client entry point is AuthAPIGateway. The direct service paths support BookingService coordination and local integration checks.

NotificationService consumes the `booking-notifications` queue described above.

## Request JSON examples

All JSON examples below are request bodies. Replace UUIDs and date values with IDs and dates from the current database. Authenticated requests need `Authorization: Bearer {{token}}`.

### Signup and login

```http
POST {{gatewayUrl}}/auth/signup
Content-Type: application/json
```

```json
{
  "username": "debo",
  "email": "customer@example.com",
  "password": "replace-with-a-password"
}
```

```http
POST {{gatewayUrl}}/auth/login
Content-Type: application/json
```

```json
{
  "email": "customer@example.com",
  "password": "replace-with-a-password"
}
```

### Role and permission administration

```json
{
  "name": "qa_tester",
  "description": "Temporary role for API route checks"
}
```

Use that body for `POST /roles` and `PUT /roles/:id`; the PUT schema requires both fields. To assign a role to a user, send `POST /roles/:userId/assign/:roleId` with no body. To grant or remove a permission, send:

```json
{
  "permissionId": "{{permissionId}}"
}
```

### State and city management

```json
{
  "name": "Test State",
  "code": "TS",
  "type": "STATE"
}
```

A state PATCH can contain any non-empty subset, for example:

```json
{
  "name": "Updated Test State"
}
```

```json
{
  "name": "Test City",
  "stateId": "{{stateId}}"
}
```

A city PATCH can contain either or both fields:

```json
{
  "name": "Updated Test City"
}
```

### Hotel and room inventory

Hotel creation resolves the city within the named state:

```json
{
  "name": "QA Test Hotel",
  "address": "1 Test Road",
  "cityName": "Mumbai",
  "stateName": "Maharashtra"
}
```

Hotel updates accept a non-empty subset of `name`, `address`, and location fields. If changing location, provide `cityName`; provide `stateName` when the target city is in a different state.

```json
{
  "address": "2 Updated Test Road"
}
```

Create a room category (allowed room types: `SINGLE`, `DOUBLE`, `FAMILY`, `DELUXE`, `SUITE`):

```json
{
  "roomType": "DELUXE",
  "price": 5000
}
```

Update a category with any non-empty subset:

```json
{
  "price": 5500
}
```

Register physical room numbers (trimmed, uppercased, and unique within the category):

```json
{
  "roomNumbers": ["QA-101", "QA-102"]
}
```

Create one or more availability periods. The end date is exclusive. The example dates must be adjusted to fall in the current three-month booking window and must not overlap another saved period for that category.

```json
{
  "periods": [
    {
      "startDate": "2026-11-10",
      "endDate": "2026-11-15",
      "roomsPerNight": 2
    }
  ]
}
```

### Booking creation and internal hold

Create a pending booking. The request does not accept `bookingAmount` or physical-room IDs; HotelService chooses rooms and BookingService calculates the price.

```http
POST {{gatewayUrl}}/bookings
Content-Type: application/json
Authorization: Bearer {{token}}
```

```json
{
  "customerEmail": "customer@example.com",
  "hotelId": "{{hotelId}}",
  "roomCategoryId": "{{roomCategoryId}}",
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-12",
  "roomCount": 1
}
```

The confirmation request has no JSON body. Use the `idempotencyKey` returned from creation, before the 10-minute hold expires:

```http
POST {{gatewayUrl}}/bookings/{{idempotencyKey}}/confirm
Authorization: Bearer {{token}}
```

The equivalent direct HotelService hold request used by BookingService is:

```json
{
  "bookingId": "{{bookingId}}",
  "roomCategoryId": "{{roomCategoryId}}",
  "startDate": "2026-11-10",
  "endDate": "2026-11-12",
  "roomsRequired": 1
}
```

## Example success and error responses

Signup returns the safe user record without the password hash:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "{{userId}}",
    "username": "debo",
    "email": "customer@example.com",
    "createdAt": "2026-11-02T01:00:00.000Z",
    "updatedAt": "2026-11-02T01:00:00.000Z"
  }
}
```

A successful booking creation returns a pending booking with the generated key and selected physical-room IDs:

```json
{
  "success": true,
  "message": "Pending booking created successfully",
  "data": {
    "id": "{{bookingId}}",
    "hotelId": "{{hotelId}}",
    "roomCategoryId": "{{roomCategoryId}}",
    "customerEmail": "customer@example.com",
    "checkIn": "2026-11-10",
    "checkOut": "2026-11-12",
    "roomCount": 1,
    "bookingAmount": 7000,
    "status": "PENDING",
    "holdExpiresAt": "2026-11-02T01:10:00.000Z",
    "idempotencyKey": "{{idempotencyKey}}",
    "physicalRoomIds": ["{{physicalRoomId}}"]
  }
}
```

A successful confirmation returns an outcome and booking:

```json
{
  "success": true,
  "message": "Booking confirmation processed",
  "data": {
    "outcome": "CONFIRMED",
    "booking": {
      "id": "{{bookingId}}",
      "status": "CONFIRMED",
      "bookingAmount": 7000
    }
  }
}
```

Other confirmation outcomes include `ALREADY_FINALIZED`, `EXPIRED`, `NOT_FOUND`, `BOOKING_NOT_FOUND`, and `NOT_PENDING`. The HTTP confirmation controller returns the outcome in the response data.

Typical errors use this envelope:

```json
{
  "success": false,
  "message": "Not enough rooms available for the requested dates"
}
```

## Postman route checks

The repository includes:

- `postman/collections/distributed-hotel-booking-api-checks.postman_collection.json`
- `postman/environments/distributed-hotel-booking-local.postman_environment.json`

Import both files into Postman and select **Distributed Hotel Booking Local**. The environment pre-fills base URLs and leaves username, email, password, tokens, and IDs blank. Fill the variables in the active environment. Variable names are case-sensitive (`loginEmail`, `loginPassword`). Run requests manually from the collection.

A useful request order is:

1. Sign up and log in; the collection saves the returned access token for protected routes.
2. Read seeded states, cities, hotels, room categories, and physical rooms. Use their IDs in later requests.
3. Use a user with the required role/permission for hotel inventory mutation routes.
4. Create an availability period for the selected category and wait for the HotelService room-generation worker to create room-night rows.
5. Create the pending booking with dates covered by generated availability.
6. Confirm with the returned idempotency key before `holdExpiresAt`.
7. Check NotificationService logs for email delivery or job failure. SMTP delivery is asynchronous.

Availability periods are created through the inventory API and then expanded into room-night rows by the HotelService worker. Inventory-management requests use the corresponding role permissions; customer signup provides the customer role.
