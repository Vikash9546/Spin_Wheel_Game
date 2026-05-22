# Spin Wheel Game

An interactive, real-time multiplayer spin wheel game built with Node.js, Express, Socket.IO, BullMQ, Prisma (PostgreSQL), and React (Vite). The game mechanics follow an elimination format where players pool their coins, and the system dynamically spins to eliminate players one by one until a final winner is declared.

---

## Project Structure

This project is organized as a monorepo containing two main directories:

- [**backend**](file:///Users/vikashkumar/Desktop/RoxStar/backend): Node.js & Express REST API, Socket.IO server for real-time synchronization, and BullMQ worker queue for game timings and operations.
- [**frontend**](file:///Users/vikashkumar/Desktop/RoxStar/frontend): Vite + React Single Page Application (SPA) styled with Tailwind CSS, utilizing Socket.io-client for live state updates.

---

## 1. Configuration & Environment Variables

Templates for these variables can be found in:
- Backend: [backend/.env.example](file:///Users/vikashkumar/Desktop/RoxStar/backend/.env.example)
- Frontend: [frontend/.env.example](file:///Users/vikashkumar/Desktop/RoxStar/frontend/.env.example)

### Backend Environment Variables (backend/.env)

| Variable | Description | Recommended Value (Local) |
| :--- | :--- | :--- |
| PORT | Port number the backend server runs on | 3000 |
| DATABASE_URL | PostgreSQL connection URL | postgresql://postgres:pass@localhost:5432/postgres?schema=public |
| REDIS_URL | Redis connection URL (used for queues & locks) | redis://127.0.0.1:6379 |
| JWT_SECRET | Secret key for signing session tokens | Generate a secure string |
| NODE_ENV | Environment identifier | development |

### Frontend Environment Variables (frontend/.env)

| Variable | Description | Value (Local) | Value (Production) |
| :--- | :--- | :--- | :--- |
| VITE_API_URL | Base endpoint URL for the REST API | http://localhost:3000/api | https://your-backend.onrender.com/api |
| VITE_SOCKET_URL | Base URL for the Socket.io WebSocket server | http://localhost:3000 | https://your-backend.onrender.com |

---

## 2. Setup Instructions & How to Run

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v18 or higher recommended)
- PostgreSQL (running locally or cloud-hosted on Supabase/Neon)
- Redis (running locally or cloud-hosted on Upstash)

---

### Local Execution

#### Step 1: Configure and Start the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the example env file and update it with your actual PostgreSQL and Redis credentials:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Sync the database schema and generate the Prisma Client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Start the backend development server (hot-reloads via Nodemon):
   ```bash
   npm run dev
   ```

#### Step 2: Configure and Run the Frontend
1. In a new terminal tab, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the local URL (typically http://localhost:5173/).

---

## 3. Database Schema & Migrations

The database is built on PostgreSQL and managed using Prisma ORM.

### Table Schema Definitions
The database schema consists of the following tables:

#### 1. users (User model)
Stores player credentials, account parameters, and current coin balances.
- id (UUID, Primary Key)
- name (String): Player display name
- email (String, Unique): Registration email
- password_hash (String): Hashed password for authentication
- role (String, default: "user"): Access level
- coins (BigInt): Real-time balance of coins
- created_at (DateTime)

#### 2. spin_wheels (SpinWheel model)
Tracks game session details, fees, distribution pools, and current status.
- id (UUID, Primary Key)
- status (WheelStatus enum): WAITING | STARTING | RUNNING | COMPLETED | ABORTED
- entry_fee (BigInt): Coins required to join the game
- min_players (Int, default: 3): Minimum threshold to start
- winner_pool (BigInt): Coins accumulated for the winner (70% standard)
- admin_pool (BigInt): Coins accumulated for the room creator (15% standard)
- app_pool (BigInt): Commission pool (15% standard)
- current_round (Int): Current round index
- elimination_order (String[]): Ordered list of user IDs in their elimination sequence
- next_elimination_at (DateTime): Countdown timestamp for the next elimination round
- winner_id (String, Nullable): Final winner's user ID
- created_at (DateTime)
- updated_at (DateTime)

#### 3. wheel_participants (WheelParticipant model)
Junction table tracking many-to-many associations between users and game rooms.
- id (UUID, Primary Key)
- wheel_id (UUID, Foreign Key): References spin_wheels
- user_id (UUID, Foreign Key): References users
- joined_at (DateTime)
- eliminated_at (DateTime, Nullable): Time when the user was eliminated from the round
- is_winner (Boolean, default: false): True if this participant won the room
- Unique Constraint: [wheel_id, user_id] ensures a player cannot join the same wheel twice.

#### 4. transactions (Transaction model)
A historical ledger tracking all coin movement in the system.
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key): References users
- type (TransactionType enum): JOIN_DEBIT | REFUND | WIN_REWARD | ADMIN_REWARD | APP_COMMISSION | DEPOSIT | WITHDRAWAL
- amount (BigInt): Positive for credit, negative for debit
- balance_before (BigInt): Account balance before transaction
- balance_after (BigInt): Account balance after transaction
- reference_type (String, Nullable): Source model identifier (e.g. "SpinWheel")
- reference_id (String, Nullable): UUID of reference model
- created_at (DateTime)

#### 5. game_config (GameConfig model)
Dynamic distribution parameters.
- id (UUID, Primary Key)
- winner_percentage (Int, default: 70)
- admin_percentage (Int, default: 15)
- app_percentage (Int, default: 15)

---
