# Take Home Assignment (SE)

## Context

We are a "Car Butler" startup bridging the online and offline worlds. Customers use our mobile app to book on-demand car care services (washes, detailing, maintenance).

As we migrate our backend to Node.js, we need a robust booking microservice. This service handles our most critical flow: **Real-time Appointment Booking.**

## The Task

Build a RESTful microservice that allows users to check availability and book appointments for specific dates.

**Time expectation:** 2-3 hours. We value clean architecture, correct DB lifecycle management, and correctness over feature quantity.

## Tech Stack Requirements

- **Runtime:** [Bun](https://bun.sh/) (Must use Bun for package management and running the server).
- **Framework:** [Hono](https://hono.dev/).
- **Database:** PostgreSQL.
- **ORM/Query Builder:** [Drizzle ORM](https://orm.drizzle.team/).

## The Challenge

In a high-demand service business, **concurrency is key**.

- **Constraint:** We have **1 service bay** (capacity = 1).
- **Race Condition:** User A and User B both try to book the *same* time slot on the *same* date at the exact same millisecond.
- **Requirement:**
    1. Generate available slots dynamically (Code: Business Hours - DB: Booked Hours).
    2. Ensure the slot isn't already taken in the DB (State check).
    3. Only *one* booking should succeed. The other must fail gracefully.

## Clarifications & Assumptions (Read First)

To avoid ambiguity, please make the following assumptions:

1. **Business Hours:** The shop is open from **09:00 to 17:00**.
    - Slots are exactly 1 hour long.
    - **First Slot:** Starts at `09:00` (ends at 10:00).
    - **Last Slot:** Starts at `16:00` (ends at 17:00).
    - The shop *closes* at 17:00, so you cannot book a slot starting at 17:00.
2. **Time Format:**
    - Dates: `YYYY-MM-DD` (ISO 8601).
    - Times: `HH:mm` (24-hour format, e.g., "09:00", "16:00").
3. **Timezones:** Assume the server and the shop exist in **UTC** (or system local time). You do not need to handle complex timezone conversions.

## API Specification

Your server should run on `http://localhost:3000`.

### 1. Health Check

Simple endpoint to verify the service is up.

**Request:**`GET /health`

**Response (200 OK):**

```
{
  "status": "ok"
}
```

### 2. Get Available Slots

Returns a list of available start times for a given date.

**Request:**`GET /slots?date=2024-01-20`

- Query Param: `date` (ISO 8601 Date format `YYYY-MM-DD`).

**Response (200 OK):**

- Logic: Return all start times (09:00 to 16:00) minus any booked slots in the DB.
- Example: If 10:00 and 12:00 are booked, they should be missing from the list.

```
{
  "available_times": [
    "09:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00"
  ]
}
```

**Response (400 Bad Request):**

- If date format is invalid or missing.
    
    ```
    {
      "error": "Invalid date format"
    }
    ```
    

### 3. Book Appointment

Attempts to reserve a specific time slot for a user.

**Request:**`POST /bookings`

**Body:**

```
{
  "user_id": "user_123",
  "date": "2024-01-20",
  "time": "10:00"
}
```

**Logic (Must be Atomic):**

1. **Validation:** Check if `time` is a valid start time (09:00 - 16:00).
2. **Availability:** Check if a booking already exists for this `date` + `time` (Capacity = 1).
3. **Execution:** Insert booking record.

**Response (200 OK - Success):**

```
{
  "booking_id": "booking_abc123"
}
```

**Response (400 Bad Request - Failure):**

- Case 1: Slot is already taken (Concurrency check).
    
    ```
    {
      "error": "Slot full"
    }
    ```
    
- Case 2: Time is outside business hours.
```
{
  "error": "Shop closed"
}
```

- Case 3: User ID does not exist (Foreign Key error).
    
    ```
    {
      "error": "User not found"
    }
    ```
    

## Setup & Delivery

1. **Database Schema & Seeding (Crucial):**
    - Provide a migration script to set up your tables (`users`, `bookings`).
    - Provide a **seed script** (e.g., `bun run seed`) that:
        - Clears the database.
        - Creates **at least 4 users** (e.g., "Alice", "Bob", "Charlie", "Dave").
        - We will run this seed script before testing your API.
2. **Database Connection:** Use a free managed PostgreSQL service (e.g., [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)). Provide a `.env.example` file showing the required environment variables (e.g., `DATABASE_URL`).
3. Provide the command to start the server (e.g., `bun run dev`).
4. **Documentation & Onboarding Guide:**
    - Treat this submission as a real repository. Include a comprehensive `README.md` (or `DEVELOPMENT.md`) written for a **new developer joining the team**.
    - It must explain:
        - **Architecture:** Brief overview of your code structure and design choices.
        - **Setup:** Step-by-step instructions to install dependencies and configure the environment.
        - **Running the App:** How to run migrations, seed the DB, and start the server.
        - **Testing:** How to run the unit/integration tests successfully.
5. **Verification:** We will run an automated integration test suite against your API. Ensure your endpoints match the spec exactly.

## What We Look For

- **Algorithmic Thinking:** How do you determine availability by combining hardcoded rules (9-5) with DB state?
- **Transaction Safety:** How do you handle the "Check Availability -> Insert Booking" flow atomically for a specific date?
- **Code Quality & Testing:** Do you write your own unit tests for business logic? Is your error handling robust?
- **Communication:** Is your README clear enough for a junior developer to onboard without asking you questions?
- **DB Lifecycle:** Are your migrations and seed scripts clean and idempotent?