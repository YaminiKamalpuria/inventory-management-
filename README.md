# 🧿 InvenTrack — Inventory & Sales Management System

A full-stack MERN application for inventory, sales, invoices, and analytics.

## 🧠 Tech Stack
- **Frontend**: React JS + Vanilla CSS (Module CSS) — NO Tailwind
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose)
- **Auth**: JWT + bcryptjs
- **Other**: node-cron, nodemailer, multer, csv-parser, recharts

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or MongoDB Atlas)

### 1. Clone / Extract Project

### 2. Backend Setup
```bash
cd backend
npm install
```

Create/update `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventory_db
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development
```

> **Note**: For Gmail, use an [App Password](https://myaccount.google.com/apppasswords), not your regular password.
> In `development` mode, OTP is returned in the API response so you can test without email.

Start backend:
```bash
npm start
# OR for development with auto-reload:
npm install -g nodemon && npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 📋 Features

### 🔐 Authentication
- **Login** — email + password with JWT
- **Signup** — name, email, password with validation
- **Forgot Password** — 3-step OTP flow (Email → OTP → New Password)
- Protected routes (redirect to login if not authenticated)

### 🏠 Home Dashboard
- Sales Overview (count, revenue, profit, cost)
- Purchase Overview (count, cost, cancels, returns)
- Inventory Summary (in stock, to be received)
- Product Summary (suppliers, categories)
- Sales & Purchase bar chart (weekly / monthly toggle)
- Top Products list

### 📦 Products
- **Overall Inventory** summary cards (categories, total, top selling, low stock)
- Searchable, paginated product table
- **Add Individual Product** — image upload, all fields
- **Bulk CSV Upload** — drag & drop or browse, preview before upload
- **Buy Simulation** — click any product row → enter qty → generates invoice + reduces stock
- Stock status auto-calculated: In-stock / Low-stock / Out-of-stock

### 🧾 Invoices
- Summary cards (recent, total, paid, unpaid amounts)
- Invoice list with pagination & search
- 3-dot actions: **Mark Paid/Unpaid**, **View Invoice**, **Delete**
- Full invoice preview (printable) with items, subtotal, tax, due date
- Auto-generated when product is purchased

### 📊 Statistics
- 3 **draggable** stat cards (Total Revenue / Products Sold / Products In Stock)
- Drag-and-drop reorder persisted per user in DB
- Sales & Purchase bar chart with weekly/monthly toggle
- Top Products sidebar with progress bars
- Sales Overview breakdown

### ⚙️ Settings
- Edit first name, last name
- Update password (with confirmation)
- Email field is locked (cannot be changed)

---

## 🔄 Cron Job
Runs every hour to auto-detect and update stock status:
- `quantity = 0` → **Out-of-stock**
- `quantity ≤ threshold` → **Low-stock**
- `quantity > threshold` → **In-stock**

Also triggered after each Buy simulation.

---

## 📁 Project Structure

```
inventory-app/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema with OTP + stats order
│   │   ├── Product.js       # Product with auto status
│   │   ├── Invoice.js       # Invoice with items + tax
│   │   └── Transaction.js   # Sale/purchase records
│   ├── routes/
│   │   ├── auth.js          # Signup, login, OTP, profile
│   │   ├── products.js      # CRUD, CSV, buy simulation
│   │   ├── invoices.js      # Invoice management
│   │   └── statistics.js    # Charts, top cards, overview
│   ├── middleware/
│   │   └── auth.js          # JWT protect middleware
│   ├── utils/
│   │   └── cron.js          # Hourly stock checker
│   ├── uploads/             # Product images (auto-created)
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Signup.js
│       │   ├── ForgotPassword.js
│       │   ├── Home.js
│       │   ├── Products.js
│       │   ├── Invoices.js
│       │   ├── Statistics.js
│       │   └── Settings.js
│       ├── components/
│       │   ├── Sidebar.js
│       │   └── ProtectedRoute.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── utils/
│       │   └── api.js       # Axios instance + all API calls
│       ├── styles/
│       │   └── global.css   # Vanilla CSS (no Tailwind)
│       ├── App.js
│       └── index.js
│
├── sample_products.csv      # Sample CSV for bulk upload testing
└── README.md
```

---

## 📄 Sample CSV Format
Use `sample_products.csv` to test bulk upload. Required columns:
```
productName, productId, category, price, quantity, unit, expiryDate, thresholdValue
```

---

## 🎨 Design Notes
- Matches Figma: dark sidebar (#1a1d2e) + light white content area
- Font: DM Sans (body) + DM Mono (mono text)
- Vanilla CSS only — no Tailwind, no component libraries
- Color-coded availability badges (green/yellow/red)
- Responsive for desktop + mobile
