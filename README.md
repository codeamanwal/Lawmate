# ⚖️ LawMate - Legal Consultation Platform

LawMate is a high-performance, PWA-based legal consultation platform designed to connect clients with legal experts within 30 minutes.

## 🚀 Features
- **Progressive Web App (PWA)**: Install on Android/iOS homescreens.
- **Fast Lead Intake**: Minimalistic intake form with Zod validation.
- **Real-time Notifications**: Web Push notifications via FCM.
- **Secure Payments**: Integrated with Razorpay.
- **Microservices Architecture**: Fastify-based backend services.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Fastify, Prisma ORM.
- **Database**: PostgreSQL (Prisma).
- **Auth**: Firebase Phone OTP.
- **Payments**: Razorpay.

---

## 📦 Project Structure
- `/lawmate-pwa`: Frontend React application.
- `/services`: Backend microservices (Auth, Lead, Payment, etc.).
- `/packages/db`: Shared Prisma database layer.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL
- Firebase Project
- Razorpay Account

### 2. Environment Variables
Create a `.env` file in the `lawmate-pwa` directory based on `.env.example`:

```env
# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/lawmate?schema=public"

# FIREBASE (Frontend)
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
...

# FIREBASE (Backend)
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."

# RAZORPAY
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."

# AUTH
JWT_SECRET="your-secret-key"
```

### 3. Installation
From the root directory:
```powershell
npm run install:all
```

### 4. Database Setup
Ensure your PostgreSQL is running and the `lawmate` database is created.
```powershell
npm run db:push
```

---

## 🚀 Running the Project
You need to start the API Gateway and the core microservices:

1.  **Start API Gateway** (Port 8000):
    ```powershell
    npm run dev:gateway
    ```
2.  **Start Services** (Ports 3001-3005):
    ```powershell
    npm run dev:auth
    npm run dev:lead
    npm run dev:payment
    ```
3.  **Start Frontend** (Port 5173):
    ```powershell
    npm run dev:frontend
    ```

Visit **`http://localhost:5173`** to use the application.

