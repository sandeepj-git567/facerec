# FaceSecureAI: Enterprise Biometric Access Control & Attendance System

FaceSecureAI is a production-ready, enterprise-grade AI-Based Face Recognition and Attendance System. Designed using clean architecture and SOLID principles, the platform integrates real-time OpenCV facial biometrics with Spring Boot and React to manage automated clock-ins and system auditing.

---

## Technical Architecture

* **Frontend Layer**: React.js SPA scaffolded with Vite and styled using custom Vanilla CSS. Displays cards, dashboards, charts (Chart.js), logs tables, and interacts with webcam streams.
* **Backend Layer**: Java 21 Spring Boot 3.x REST API executing business logic, managing security, and logging admin transactions.
* **Biometric AI Layer**: OpenCV Java bindings via OpenPNP, providing face detection (`CascadeClassifier`) and embedding matches (Cosine Similarity).
* **Database Layer**: MySQL 8.x holding profiles, embeddings, and transaction audits.
* **Container Layer**: Multi-stage docker files deployed through Docker Compose.

---

## Quick Start (Dockerized Deployment)

The entire microservice stack (Frontend, Backend, Database) can be built and run in a single command.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
* Ports `3000`, `8080`, and `3306` must be free.

### Build and Launch
From the root directory (`d:/facerec`), run:
```bash
docker compose up --build
```

### Accessing Services
* **Web UI (Frontend)**: [http://localhost:3000](http://localhost:3000)
* **REST API Documentation (Swagger)**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **MySQL Database**: `localhost:3306` (username: `root`, password: `password`)

---

## Local Development Setup

If you prefer to run services individually outside containers:

### 1. Database Setup
Create a MySQL 8 database named `facesecureai` and run the queries inside [schema.sql](file:///d:/facerec/schema.sql) to seed the roles and create tables.

### 2. Backend Server
1. Navigate to the `backend` directory.
2. Build the JAR:
   ```bash
   mvn clean package -DskipTests
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
4. Verification: The API will be active on [http://localhost:8080](http://localhost:8080).

### 3. Frontend Client
1. Navigate to the `frontend` directory.
2. Install packages:
   ```bash
   npm install
   ```
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Security Credentials & Auditing

### Initial Seeds
Since there are no users on start, you must register a baseline Administrator account to begin using the directory and enrollment console.

1. Open Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
2. Use the `AuthController` endpoint or insert the first user into MySQL:
   ```sql
   -- Seed an admin account (username: admin, password: password - encrypted with BCrypt)
   INSERT INTO users (username, password, email, first_name, last_name, status) 
   VALUES ('admin', '$2a$10$w80Y.vR2XvA.Zqg2aO3pbe6906zR.WfI5FhS2kpxrQy49eN58b4vS', 'admin@facesecureai.com', 'System', 'Administrator', 'ACTIVE');
   
   -- Bind admin role (assuming role ID 1 is ROLE_ADMIN)
   INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
   ```

### Audit Trail Logging
Every administrative trigger (CRUD additions, data edits, exports to Excel/PDF) registers a line in the `audit_logs` database table capturing the acting operator, action type, timestamps, and parameters.

---

## Biometric Engine Fallback Design

For compilation and execution in environments where OpenCV is not configured:
* **Dynamic Loading**: `OpenCvConfig` tries to load the native binary on start. If it is not on the library path, the system logs a warning and enters **Mathematical Simulation Mode**.
* **Simulated Face Detection**: Returns true if the image is valid and exceeds 1KB, bypassing Haar Cascade if files are absent.
* **Deterministic Hashing**: Seeds a `Random` generator with the SHA-256 hash of the photo bytes to generate a reproducible 128-float unit vector. If you enroll User A with image X, scanning image X in the terminal will *always* result in the same vector, triggering a successful 100% confidence match. Scanning a different face yields a distinct vector and triggers access denial (<30% match).
