# StockSense — Inventory Management System

A production-grade, full stack multi-user inventory management platform named **StockSense** built with the MERN stack. Manage products, track sales and purchases, generate invoices automatically, and monitor business analytics — all in one place.

🔗 **[Live Demo](https://inventory-management-nu-steel.vercel.app)** · **[GitHub Repo](https://github.com/YaminiKamalpuria/inventory-management-)**

---

## Features

### 🔐 Auth & User Management
- JWT-based authentication (30-day token expiry)
- Signup, login, and profile update
- **Forgot password via OTP email flow** — 6-digit OTP sent via Nodemailer (Gmail), valid for 10 minutes, with verify-OTP and reset-password steps
- bcryptjs password hashing (12 rounds)
- Each user's data is fully isolated (all queries scoped by `userId`)

### 📦 Product Management
- Full CRUD with image upload (Multer)
- Fields: product name, product ID, category, price, quantity, unit, expiry date, threshold value
- Search by name or product ID with pagination
- Bulk import products via **CSV upload** (csv-parser library) with row-level validation and duplicate ID detection
- Auto-status transitions via **Mongoose pre-save middleware**: `In-stock` → `Low-stock` (quantity ≤ threshold) → `Out-of-stock` (quantity = 0)

### 🤖 Hourly Stock Reconciliation (Cron)
- `node-cron` job runs every hour, scans all products, and corrects any status drift — ensuring data consistency across concurrent users on a cloud-deployed environment

### 🛒 Sales & Purchase Transactions
- Buy action reduces stock, increments `salesCount` and `revenue` on the product
- Each transaction creates a **Transaction** document (type: `sale` or `purchase`) with month/year fields for efficient time-based aggregation
- Insufficient stock is caught and rejected before any write occurs

### 🧾 Invoice Generation
- Invoices are **auto-generated** on every sale with a sequential ID (`INV-1001`, `INV-1002`, ...)
- Invoice contains: line items, subtotal, 10% tax, total amount, due date (7 days), customer name, and paid/unpaid status
- Invoice summary: total invoices, processed (paid) invoices, total paid/unpaid amount, recent transactions (last 7 days)
- Full invoice CRUD — view, update status, delete

### 📊 Statistics & Analytics
- **Top cards**: total revenue, revenue change vs last month (%), products sold, sold change %, products in stock
- **Overview**: total sales & purchases, profit (sales − purchases), in-stock count, out-of-stock count, categories, top 6 products by sales
- **Graph**: switchable weekly (last 7 days) and monthly (last 10 months) sales vs purchases chart via Recharts
- **Inventory summary**: total products, new products (last 7 days), low-stock count, out-of-stock count, top-selling products by revenue
- All analytics built with MongoDB aggregation pipelines

### ⚙️ Settings
- Update profile (first name, last name, password)
- Customise statistics card display order (persisted per user in DB)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v7, Recharts, Axios, CSS Modules |
| Backend | Node.js, Express.js 4, REST API, MVC Architecture |
| Database | MongoDB, Mongoose ODM, Aggregation Pipelines |
| Auth | JWT (jsonwebtoken), bcryptjs (12 rounds) |
| Email | Nodemailer (Gmail SMTP) |
| Automation | node-cron (hourly stock reconciliation) |
| File Handling | Multer (image + CSV upload), csv-parser |
| Deployment | Vercel (frontend), cloud backend |

---

## Project Structure

```
inventory-management/
├── frontend/
│   ├── src/
│   │   ├── components/       # Sidebar, ProtectedRoute
│   │   ├── pages/            # Home, Products, Invoices, Statistics, Settings
│   │   │                     # Login, Signup, ForgotPassword
│   │   ├── context/          # AuthContext (global auth state)
│   │   └── utils/            # API helper (axios instance)
│   └── package.json
└── backend/
    ├── models/               # User, Product, Invoice, Transaction
    ├── routes/               # auth, products, invoices, statistics
    ├── middleware/            # JWT auth guard (protect)
    ├── utils/                # cron.js (stock reconciliation job)
    ├── uploads/              # Product images & CSV temp storage
    └── server.js             # Express app entry point
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Gmail account (for OTP email — optional, fallback logs OTP to console)

### Installation

```bash
# Clone the repository
git clone https://github.com/YaminiKamalpuria/inventory-management-.git
cd inventory-management-
```

**Backend:**
```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development
```

```bash
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`

---

## Key Implementation Highlights

- **Mongoose pre-save middleware** — stock status (`In-stock` / `Low-stock` / `Out-of-stock`) auto-updates on every product save, eliminating manual status management
- **Hourly cron reconciliation** — `node-cron` catches any status drift on the deployed database, ensuring consistency even under concurrent writes
- **OTP-based password reset** — full 3-step flow (request OTP → verify OTP → reset password) using Nodemailer with a 10-minute expiry window
- **Auto invoice generation** — every buy action atomically decrements stock, creates a Transaction record, and generates a sequential Invoice in a single request
- **MongoDB aggregation pipelines** — all statistics (revenue, profit, weekly/monthly trends, top products) computed server-side with `$match`, `$group`, and `$sum` — no client-side number crunching
- **Per-row CSV validation** — bulk upload validates each row individually (checks for missing fields, invalid numbers, duplicate product IDs) and reports per-row errors without failing the entire batch
