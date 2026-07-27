# ⚡ VANISH-E | Anti-Forensics Zero-Knowledge Messaging Protocol

![System Status](https://img.shields.io/badge/SYSTEM_STATUS-ONLINE-00FF00?style=for-the-badge&logo=gnubash&logoColor=00FF00)
![Architecture](https://img.shields.io/badge/ARCHITECTURE-ZERO--KNOWLEDGE-black?style=for-the-badge&logo=security-scorecard&logoColor=00FF00)
![Stack](https://img.shields.io/badge/STACK-MERN-000000?style=for-the-badge&logo=mongodb&logoColor=00FF00)
![Deployment](https://img.shields.io/badge/DEPLOYMENT-VERCEL%20%2B%20RENDER-000000?style=for-the-badge&logo=vercel&logoColor=00FF00)

> **"Data stored is data compromised. Zero-Knowledge execution guarantees absolute privacy through automated database purging."**

---

## 👁️ System Overview

**VANISH-E** is a high-grade, ephemeral messaging protocol designed to eliminate server-side data retention. Built on a decoupled MERN stack architecture, it enforces **Zero-Knowledge client-side encryption (AES-256-GCM)** and an instantaneous **Read-and-Destroy (O(1))** database lifecycle. 

Unlike traditional platforms that retain messaging logs and metadata, VANISH-E utilizes MongoDB strictly as a transient holding vault. The server never receives unencrypted plaintext, and it never possesses the decryption key.

---

## 🌐 Live Protocol Infrastructure

| Node | Service | Target URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Terminal** | Vercel CDN | [https://vanish-e-poc.vercel.app](https://vanish-e-poc.vercel.app) | `ACTIVE` |
| **Backend Core API** | Render Cloud | [https://vanish-e-backend.onrender.com](https://vanish-e-backend.onrender.com) | `ACTIVE` |
| **Health Monitor** | UptimeRobot | `GET /api/health` | `MONITORED` |

---

## 🔒 The Zero-Knowledge Cryptographic Lifecycle

```text
+-----------------------------------------------------------------------------------+
| SENDER BROWSER | | 1. Plaintext entered --> AES-256 Key generated locally |
| 2. Ciphertext created --> Sent to Backend | | 3. Magic Link Generated:
https://vanish-e-poc.vercel.app/drop/[ID]#[AES_KEY] |
+----------------------------------------+------------------------------------------+
| HTTP POST (Only Ciphertext) | v
+-----------------------------------------------------------------------------------+
| RENDER BACKEND (Express) | | 4. Saves Ciphertext to MongoDB Atlas | | * Zero
awareness of payload contents or decryption key. |
+----------------------------------------+------------------------------------------+
| Out-of-Band Key Transfer (User Shares Link) | v
+-----------------------------------------------------------------------------------+
| RECEIVER BROWSER | | 5. GET request issues via [ID] | | 6. Express reads
Ciphertext --> PERMANENTLY DELETES RECORD FROM MONGO | | 7. Express transmits
Ciphertext to Receiver | | 8. Receiver extracts #[AES_KEY] from URL Fragment
(Never sent to server) | | 9. Client decrypts payload in local memory. |
+-----------------------------------------------------------------------------------+
```


### Key Security Assertions
1. **URL Fragment Isolation:** The encryption key resides after the `#` hash fragment. Web browsers never transmit the fragment identifier in HTTP requests. The server physically cannot log or inspect the key.
2. **Automated Read-and-Destroy Execution:** Retrieval and deletion execute in a single sequence (`findById` -> buffer payload -> `findByIdAndDelete`). Second access attempts return an unrecoverable `404 NOT FOUND`.
3. **Automated Tamper-Evidence:** If a third party intercepts the link and accesses it prior to the recipient, the record is burned. When the intended recipient opens the link, the `404` status serves as immediate cryptographic proof of compromise.
4. **MongoDB TTL Safety Net:** Unread messages auto-expire after 24 hours via MongoDB TTL indices (`createdAt: expires 86400`).

---

## ⚡ Technical Stack Specifications

### Frontend Engine
* **Framework:** React.js via Vite
* **Routing:** `react-router-dom` (SPA client-side rewrite handling via `vercel.json`)
* **Cryptography:** `crypto-js` (AES-256-GCM primitives)
* **Styling:** Monospace terminal aesthetics, high-contrast dark palette (`#050505` bg, `#00ff00` accents)

### Backend Engine
* **Runtime:** Node.js + Express.js
* **Database ODM:** Mongoose (MongoDB Atlas Cloud Cluster)
* **Authentication:** JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` (Protected Telemetry Route)
* **Security Policies:** `cors` policy binding, decoupled environment variable injection (`dotenv`)

---

## 🛠️ API Reference Baseline

### Message Vault Endpoints

#### 1. Generate Encrypted Drop
```http
POST /api/messages
Content-Type: application/json

{
  "ciphertext": "U2FsdGVkX1+...encryptedString..."
}
```

  - Response (201 Created):

```json
{
  "success": true,
  "dropId": "65f8a2b...d31"
}
```

2. Access and Destroy Drop

```http
GET /api/messages/:id
```

  - Response (200 OK):

```json
{
  "success": true,
  "data": "U2FsdGVkX1+...encryptedString..."
}
```

  - Database State: Record immediately dropped from cluster via
    findByIdAndDelete.
  - Response (404 Not Found): Returned if accessed a second time or if the
    payload expired.

Security Telemetry & System Endpoints

3. System Heartbeat (Cold-Start Prevention)

GET /api/health

  - Response (200 OK):

{
  "status": "VAULT_ONLINE",
  "time": "2026-03-31T22:15:00.000Z"
}

4. Admin Telemetry Verification

GET /api/admin/telemetry
Authorization: Bearer <JWT_TOKEN>

  - Response (200 OK):

{
  "totalDrops": 42
}

💻 Local Developer Deployment Sequence

Prerequisites

  - Node.js: v18.0.0+
  - MongoDB: Local Instance or Atlas Connection URI

Environment Setup

Backend Setup (backend/.env)

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vanish-e
JWT_SECRET=your_super_secret_jwt_key
ADMIN_PASSWORD=your_secure_admin_passphrase

Frontend Setup (frontend/.env)

VITE_API_URL=http://localhost:5000

Execution Commands

git clone https://github.com/TriggerGuy99/Vanish-E-POC.git
# Clone the repository
```bash
git clone https://github.com/TriggerGuy99/Vanish-E-POC.git
cd Vanish-E-POC

# Spin up Backend Engine
cd backend
npm install
npm run dev

# Open secondary terminal -> Spin up Frontend UI
cd frontend
npm install
npm run dev
```

🚀 Future Roadmap & Enterprise Implementation Strategy

While the current deployment is an effective full-stack MERN implementation,
scaling VANISH-E to military-grade, high-throughput enterprise infrastructure
requires moving away from interpreted runtimes and high-level garbage
collectors.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEXT-GEN ARCHITECTURE ROADMAP                    │
└─────────────────────────────────────────────────────────────────────────┘

 [ Current Stack ]                         [ Target Enterprise Infrastructure ]
 +-----------------------+                 +--------------------------------------+
 | React + Vite          |                 | WASM Core + Native Rust Frontend     |
 | Express / Node.js     |  ------------>  | Rust (Actix-Web / Axum) or Go Core   |
 | MongoDB Atlas         |                 | DragonflyDB / Redis In-Memory Engine |
 | Crypto-JS (AES-256)   |                 | PQ-Clean (Post-Quantum ML-KEM)       |
 +-----------------------+                 +--------------------------------------+ 
```

Phase 1: High-Throughput Memory-First Architecture (Rust / Go)

  - Execution Layer Migration: Transition the Express REST server to Rust
    (Actix-Web) or Go (Gin). This reduces runtime memory footprints, eliminates
    Node.js event-loop blockages, and guarantees sub-millisecond execution
    times.
  - In-Memory Volatile Storage: Replace disk-backed MongoDB with an in-memory
    database like Redis or DragonflyDB. Data will exist exclusively in RAM. Upon
    read execution, the payload key is deleted from RAM instantly.

Phase 2: Native Cryptographic Hardening (WASM & Zeroization)

  - WebAssembly (WASM) Crypto Engine: Replace crypto-js with Rust-compiled
    WebAssembly binaries (ring or sodiumoxide). Cryptographic primitives execute
    inside an isolated WebAssembly sandbox within the browser.
  - Explicit Memory Zeroization: High-level JavaScript runtimes leave string
    primitives in unmanaged RAM until garbage collected. Moving to native Rust/C
    bindings allows calling zeroize macros to overwrite RAM memory buffers with
    zeros immediately after decryption.

Phase 3: Post-Quantum Cryptographic Standards (PQC)

  - ML-KEM / Kyber Encryption Integration: Upgrade standard AES/RSA keys to
    post-quantum lattice-based algorithms (NIST-standardized ML-KEM/Kyber) to
    neutralize "Harvest Now, Decrypt Later" threats from quantum computing
    adversaries.
  - Steganographic Carrier Injection: Expand payloads into custom image-matrix
    carriers (PNG/WebP LSB injection) compiled directly on the client side via
    Rust-WASM pipelines.
