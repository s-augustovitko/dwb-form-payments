# DWB Form Payments

A robust, dual-application system featuring a public-facing course registration form for DWB and a high-performance administrative dashboard.

## 🏗 System Architecture

The project is divided into two primary environments:

1.  **Public Portal (Root):**
    *   **Frontend:** SolidJS SPA (located in `/web`).
    *   **Backend:** PHP 8.2 API (located in `/api`) handling form submissions and payments.
    *   **Environment:** Orchestrated via Apache and Podman/Docker.

2.  **Admin Dashboard (`/admin`):**
    *   **Frontend:** SolidJS SPA (located in `/admin/web`).
    *   **Backend:** Go (Golang) REST API using `sqlc` for type-safe database operations.
    *   **Proxy:** Caddy Server for serving the frontend and routing API traffic.
    *   **Database:** MySQL with automated migrations via `golang-migrate`.

---

## 🛠 Prerequisites

*   **Container Engine:** [Podman](https://podman.io/) (default in Makefiles) or Docker.
*   **Runtimes:** Node.js (v18+), Go 1.25+, and PHP 8.2.
*   **Tools:** `make`, `npm`, `inotifywait` (for dev mode).

---

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
APP_ENV=prod
ALLOWED_ORIGINS=https://app.caminodeldiamante.pe
DB_USER=your_user
DB_PASS=your_password
DB_HOST=localhost:3306
DB_NAME=your_db
CULQI_PRIV_KEY=sk_live_culkiprivkey
```

### 2. Public Portal Deployment
To build the frontend and start the Apache container:
```bash
make run
```
*   **Build Only:** `make build` (outputs to `/dist`)
*   **Development:** `make dev` (watches for changes and rebuilds)
*   **FTP Deploy:** `make deploy` (requires `.ftp.env`)

```env
FTP_USER=your_user
FTP_PASS=your_pass
FTP_HOST=localhost:21
FTP_TARGET_DIR=/
```

### 3. Admin Dashboard Deployment
Navigate to the admin folder:
```bash
cd admin
# Run database migrations
make run_migrations

# Start the Go API and Caddy server
make run
```
* **Access:** The dashboard is available at `http://localhost:3000`
* **Generate SQL Code:** `make deps` (runs `sqlc` and formats code)
* **Stop Services:** `make stop

---

## 📂 Project Structure

* **/api**: Public PHP backend.
* **/web**: Public SolidJS frontend.
* **/admin**: Go backend and Admin SolidJS frontend.
* **/docker**: Infrastructure and Dockerfiles.
* **/dist**: The final compiled code for production.
* **/scripts**: Deployment and automation scripts.

---

## 🔧 Development Workflow

### Database Migrations
Migrations are stored in `admin/migrations`. To apply them:
```bash
cd admin && make run_migrations
```

### Logs & Debugging
To tail logs for a specific service (e.g., the admin API):
```bash
# Public
make logs SERVICE=apache

# Admin
cd admin && make logs SERVICE=service-dwb-admin
```

### Admin Observability
The Admin stack includes **Dozzle**, a lightweight container log viewer.
* **Logs UI:** Access via `http://dozzle.localhost:3000` (if routed via Caddy) or check your `compose.yaml` for the specific Dozzle port if mapped separately.

### 🧹 Cleanup
Use these commands to reset your environment or fix build issues:

| Command | What it does |
| :--- | :--- |
| **`make clean`** | Stops containers and deletes the `dist/` build folder. Use this for a **standard reset**. |
| **`make clean_all`** | **The Nuclear Option.** Deletes all containers, volumes, and **cached images**. Use this to free up disk space or fix "stuck" builds. |

---

## 🛠 Tech Stack
* **Frontend:** SolidJS, Vite, TypeScript.
* **Backend:** PHP 8.2 (Public) / Go 1.25 (Admin).
* **Database:** MySQL + `sqlc` (Go) + `golang-migrate`.
* **Proxy/Server:** Apache (Public) / Caddy (Admin).
* **Containerization:** Podman/Docker.

