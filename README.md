# ⚖️ LawOnCall - Legal Consultation Platform

LawOnCall is a high-performance, PWA-based legal consultation platform designed to connect clients with legal experts within 30 minutes.

## 🚀 Features
- **Progressive Web App (PWA)**: Install on Android/iOS homescreens.
- **Fast Lead Intake**: Minimalistic intake form with Zod validation.
- **Dual Authentication**: Support for both Phone OTP and Email/Password via Firebase.
- **Edit Profile**: Users can update their name and city from the dashboard.
- **Real-time Notifications**: Web Push notifications via FCM.
- **Exotel Outbound Calling**: Secure Click-to-Call connecting lawyers and clients.
- **Secure Payments**: Integrated with PhonePe / Payment Gateway.
- **Microservices Architecture**: Fastify-based backend services.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Fastify, Prisma ORM.
- **Database**: PostgreSQL (Prisma).
- **Auth**: Firebase Phone OTP & JWT-based session security.
- **Calling Provider**: Exotel (Outbound voice calling).

---

## 📦 Project Structure
- `/lawmate-pwa`: Frontend React application.
- `/services`: Backend microservices (Auth, Lead, Gateway, etc.).
- `/packages/db`: Shared Prisma database layer.

---

## 📞 Exotel Click-to-Call API Integration

To connect lawyers and clients securely without exposing private phone numbers, LawMate integrates **Exotel's Click-to-Call API**. Outbound calls are initiated via the lawyer dashboard, and status updates (including call recordings) are stored in the database via webhooks.

### 1. Call Connection Architecture

```mermaid
sequenceDiagram
    participant Lawyer as Lawyer Web App
    participant Gateway as API Gateway (8000)
    participant LeadService as Lead Microservice
    participant Exotel as Exotel Call API
    participant DB as PostgreSQL Database
    
    Lawyer->>Gateway: POST /api/leads/:leadId/call (JWT Token)
    Gateway->>LeadService: Forward Call Request
    LeadService->>DB: Fetch Lawyer & Client Phone Numbers
    DB-->>LeadService: Return Phone Numbers
    LeadService->>Exotel: POST connect.json (Basic Auth + From/To/CallerID)
    Exotel-->>LeadService: 200 OK (Returns Call SID)
    LeadService->>DB: Save Call SID & Set Status to CONNECTING
    LeadService-->>Gateway: Return Success Response
    Gateway-->>Lawyer: Update UI to "Calling..."
    Note over Exotel: Exotel calls Lawyer first. Once answered,<br/>it dials the Client and bridges the call.
    Note over Exotel: Call Ends
    Exotel->>LeadService: Webhook POST /api/leads/call-status (Call Duration & Recording URL)
    LeadService->>DB: Update Recording URL & Status to COMPLETED
```

### 2. API Integration Details

#### **A. Initiate Outbound Call**
* **Endpoint**: `POST /api/leads/:id/call` (routed through API Gateway to Lead service)
* **Auth**: Header `Authorization: Bearer <token>` (Advocate account required)
* **Exotel API Endpoint**: `https://<subdomain>/v1/Accounts/<accountSid>/Calls/connect.json`
* **Authentication**: HTTP Basic Auth (`EXOTEL_API_KEY` : `EXOTEL_API_TOKEN`)
* **Request Parameters**:
  * `From`: Advocate's mobile number (e.g., `+919999999999`)
  * `To`: Client's mobile number (e.g., `+918888888888`)
  * `CallerId`: Your registered virtual ExoPhone number.
  * `StatusCallback`: Absolute callback URL for event webhooks.
  * `StatusCallbackEvents[]`: `terminal` (triggered on call termination).
  * `Record`: `true` (enables recording).

#### **B. Exotel Callback Webhook**
* **Endpoint**: `POST /api/leads/call-status` (public webhook receiver)
* **Purpose**: Receives real-time call updates when a call is completed.
* **Payload Handled**:
  * `CallSid`: Unique Exotel call identifier matching database record.
  * `Status`: Call completion status (e.g., `completed`, `failed`).
  * `RecordingUrl`: URL link to download the call conversation MP3.
  * `Duration`: Combined call duration in seconds.
* **Data Synced**: Automatically updates the `Consultation` model matching the `CallSid` to store duration and the voice recording URL.

---

## 💾 Database Schema (Prisma)

The Prisma database schema contains the following models supporting call tracking:

```prisma
model Consultation {
  id           String             @id @default(uuid())
  leadId       String
  lead         Lead               @relation(fields: [leadId], references: [id])
  lawyerId     String
  lawyer       User               @relation("LawyerConsultations", fields: [lawyerId], references: [id])
  status       ConsultationStatus @default(PENDING)
  scheduledAt  DateTime
  callSid      String?            @unique // Unique ID returned by Exotel
  recordingUrl String?            // URL of call audio storage hosted by Exotel
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
}
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL
- Firebase Project
- Exotel Developer Account (KYC Approved)

### 2. Environment Variables
Ensure the following variables are configured in the `lawmate-pwa/.env` (frontend) and `/services` configuration files:

```env
# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/lawmate?schema=public"

# FIREBASE (Frontend)
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."

# EXOTEL VOICE CALL CREDENTIALS
EXOTEL_API_KEY="your_exotel_api_key"
EXOTEL_API_TOKEN="your_exotel_api_token"
EXOTEL_ACCOUNT_SID="your_exotel_account_sid"
EXOTEL_SUBDOMAIN="api.exotel.com"
EXOTEL_EXOPHONE="your_exophone_number"
EXOTEL_STATUS_CALLBACK_URL="https://your-public-url.com/api/leads/call-status"
```

### 3. Installation
From the root directory:
```powershell
npm run install:all
```

### 4. Database Setup
```powershell
npm run db:push
```

---

## 🚀 Running the Project
Start all microservices and the dev frontend server:

```powershell
npm run dev:all
```

Visit **`http://localhost:5173`** to access the application.

---

## 🛡️ Compliance
The platform is built with **DPDP Act (India)** compliance in mind, featuring explicit consent checkboxes, and keeps all client-advocate call recordings fully encrypted and linked via Exotel for regulatory audit purposes.
