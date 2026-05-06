### AI-Powered WhatsApp Finance Assistant
### MERN Stack • Twilio WhatsApp API • MongoDB • React Dashboard
```
• Built a full-stack personal finance assistant enabling conversational expense tracking through WhatsApp using Twilio webhook integration and Express.js backend services.
• Designed a hybrid expense parsing pipeline combining rule-based categorization, regex extraction, and AI-assisted parsing architecture for intelligent transaction classification.
• Developed a React + Tailwind CSS analytics dashboard featuring spending trends, category-wise visualizations, budget tracking, and recent transaction monitoring using Recharts.
• Implemented MongoDB aggregation pipelines for monthly spending analysis, trend computation, category summaries, and real-time financial insights with GitHub Actions CI workflow integration.
```

# AI-Powered WhatsApp Finance Assistant

A full-stack personal finance assistant that enables conversational expense tracking through WhatsApp using Twilio webhook integration, MongoDB analytics, and a React dashboard for visualization.

---

# Features

* WhatsApp-based expense tracking
* Conversational transaction input
* Budget monitoring and alerts
* Monthly spending analytics
* Category-wise expense visualization
* Recent transaction tracking
* React + Tailwind dashboard
* MongoDB aggregation pipelines
* GitHub Actions CI workflow

---

# Tech Stack

## Frontend

* React
* Tailwind CSS
* Recharts

## Backend

* Node.js
* Express.js

## Database

* MongoDB Atlas

## Integrations

* Twilio WhatsApp Sandbox
* ngrok

## DevOps

* GitHub Actions

---

# System Architecture

WhatsApp User
↓
Twilio Webhook
↓
Express Backend
↓
MongoDB Database
↓
React Dashboard

---

# Project Structure

```text
whatsapp-ai-finance-bot/
│
├── controllers/
├── models/
├── services/
├── dashboard/
├── .github/workflows/
├── server.js
├── package.json
└── README.md
```

---

# Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/kamalesh2602/whatsapp-ai-finance-bot.git

cd whatsapp-ai-finance-bot
```

---

# Backend Setup

## 2. Install Backend Dependencies

```bash
npm install
```

---

## 3. Create `.env` File

Create a `.env` file in the root directory.

```env
MONGO_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

---

## 4. Start Backend Server

```bash
node server.js
```

Backend runs on:

```text
http://localhost:3000
```

---

# Frontend Setup

## 5. Go to Dashboard Folder

```bash
cd dashboard
```

---

## 6. Install Frontend Dependencies

```bash
npm install
```

---

## 7. Create Frontend `.env`

Inside `dashboard/.env`

```env
VITE_PHONE_NUMBER=%2B<phonenumber>
```

---

## 8. Start Frontend

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# Twilio WhatsApp Setup

## 9. Start ngrok

In a new terminal:

```bash
ngrok http 3000
```

Copy the generated HTTPS URL.

Example:

```text
https://abcd1234.ngrok-free.app
```

---

## 10. Configure Twilio Sandbox Webhook

Go to Twilio WhatsApp Sandbox settings.

Paste:

```text
https://your-ngrok-url/webhook
```

Example:

```text
https://abcd1234.ngrok-free.app/webhook
```

Set method as:

```text
POST
```

---

# Usage

Send messages through WhatsApp sandbox:

```text
Spent 500 on food
Uber ride 200
Netflix subscription 300
```

The bot:

* parses expenses
* stores transactions in MongoDB
* updates dashboard analytics

---

# Dashboard Features

* Total spending overview
* Budget tracking cards
* Monthly spending trends
* Category breakdown charts
* Recent transaction history

---

# CI/CD

GitHub Actions workflow included for:

* backend syntax validation
* frontend production build checks
* automated dependency installation

Workflow file:

```text
.github/workflows/ci.yml
```

---

# Future Improvements

* AI-generated financial insights
* User authentication
* Cloud deployment
* Multi-user support
* Smart spending recommendations

---

# Author

Kamalesh G
