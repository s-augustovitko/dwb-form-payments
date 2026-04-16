# DWB Form Payments

A robust, dual-application system for DWB Form Payments. The project manages two distinct, interconnected services: a public-facing portal and an administrative dashboard.

## 🚀 Overview & Operational Context

The project is designed to support two primary operational modes, managed by environment variables:

1.  **Development (Local):** Running from the project root (`.local.env`). This context connects to local services (e.g., local databases) for safe testing and development.
2.  **Staging/Production:** Running from component-specific directories (`/admin` or `/forms`). These contexts utilize the root `.env` file, connecting to deployed or staging environments.

## 🧱 System Architecture

The system is composed of three main boundaries:

1.  **Public Portal (`/forms`):**
    *   **Function:** Handles public form submissions and payments.
    *   **Frontend:** SolidJS SPA (Located in `/forms/web`).
    *   **Backend:** PHP 8.0 API (Located in `/forms/api`).
    *   **Orchestration:** Apache / Podman/Docker.
2.  **Admin Dashboard (`/admin`):**
    *   **Function:** Internal management and data viewing.
    *   **Frontend:** SolidJS SPA (Located in `/admin/web`).
    *   **Backend:** Go (Golang) REST API using `sqlc` for type-safe database operations.
    *   **Proxy:** Caddy Server.
3.  **Database Migrations (`/migrations`):**
    *   **Function:** Manages MySQL schema changes.
    *   **Files:** `*.up.sql` (Migrations) and `*.down.sql` (Teardown).

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | SolidJS, Vite, TypeScript | Used in `forms/web` and `admin/web`. |
| **Backend** | PHP 8.0 (Public) / Go 1.25 (Admin) | Core business logic services. |
| **Database** | MySQL | Managed via `sqlc` (Go) and `golang-migrate`. |
| **Proxy/Server** | Apache / Caddy | Serving and routing API traffic. |
| **Containerization** | Podman / Docker | Uses `local.compose.yaml` for local orchestration. |

## ⚙️ Prerequisites

Before starting, ensure the following tools and runtimes are installed:

*   **Container Engine:** Podman (preferred) or Docker.
*   **Runtimes:** Node.js (v24+), Go 1.25+, and PHP 8.0.
*   **Tools:** `make`, `npm`, `go`, `inotifywait` (for development mode).

## 📝 Setup & Workflow

### 1. Configuration

You must define credentials in two primary files:

*   **`.local.env` (Local):** Credentials for local databases and services (used by the root context).
*   **`.env` (Deployment):** Credentials for live/staging endpoints and external API keys.
*   **FTP Credentials:** For deployment, define credentials in `.ftp.env` (in root) with `FTP_USER`, `FTP_PASS`, `FTP_HOST`, and `FTP_TARGET_DIR`.

### 2. Core Commands

The project utilizes dedicated `Makefile`s within each major component (`root`, `admin`, `forms`) to manage context-specific operations.

#### A. Root Context (Local Development)

Used for local development and orchestration.

| Command | Description | Usage Notes |
| :--- | :--- | :--- |
| `make dev` | Starts a development watch mode, rebuilding on changes. | Optional `APPS=...` to target a specific app. |
| `make run` | Builds and runs all services defined in `local.compose.yaml`. | Optional `SERVICE=...` or `FLAGS=...` for fine-tuning. |
| `make build` | Compiles all necessary assets without running containers. | |
| `make clean` | Stops and removes containers based on the compose file. | |
| `make clean_all` | Clears all local container state, volumes, and images. | Use with caution; impacts other services. |
| `make logs SERVICE=<service>` | Views logs for a specific service. | e.g., `make logs SERVICE=dwb-forms` |
| `make exec SERVICE=<service>` | Executes a command inside a running container. | |
| `make help` | Lists all available `make` commands. | |

#### B. Component Context (Staging/Production)

When operating in specific directories, the environment switches to use the deployed `.env` variables.

| Directory | Context | Dependency Command | Key Commands |
| :--- | :--- | :--- | :--- |
| **`/admin`** | Admin Dashboard | `make deps` | Manages Go backend, Caddy proxy, and Admin SPA lifecycle. |
| **`/forms`** | Public Portal | `make deps` | Manages PHP API, Public SPA, and deployment. |
| **`/forms`** | Deployment | `make deploy` | Requires `.ftp.env` for FTP transfer. |

### 3. Development Workflow Details

#### Database Migrations

*   **Running Migrations:** `make run_migrations`
*   *Note:* If migration parameters need updating, modify the relevant compose file (`migrations.compose.yaml` or related `.env` file).

#### Logs & Observability

*   **Standard Logging:** Always specify the service and the context (root or component directory).
    *   *Example:* `make logs SERVICE=dwb-forms`
*   **Local Log UI:** The Development setup and Admin stack support **Dozzle**, accessible at `http://dozzle.localhost:3000` (if routed via Caddy).

## 📂 Project Structure Reference

*   **/forms:** Dedicated Forms Service. Contains the public-facing application logic.
    *   `forms/api/`: PHP backend API and business logic.
    *   `forms/web/`: Public-facing SolidJS SPA frontend.
    *   `forms/Dockerfile`, `forms/Makefile`, `forms/compose.yaml`: Defines container setup.
*   **/admin:** Administrative dashboard module.
    *   `admin/internal/`: Go backend logic.
    *   `admin/cmd/`: Go main application entry points.
    *   `admin/config/`: JSON configurations for the Go application.
    *   `admin/web/`: SolidJS frontend for the admin dashboard.
    *   `admin/Dockerfile`, `admin/Makefile`, `admin/compose.yaml`: Defines container setup.
*   **/migrations:** MySQL schema migration files.
*   **/dist:** Final compiled code intended for production deployment.
