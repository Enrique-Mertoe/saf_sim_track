# 📱 SIM Card Management System

A web-based system for tracking SIM card sales, matching them against Safaricom activation reports, and generating performance insights across multiple sales teams.

---

## 🚀 Overview

The **SIM Card Management System** helps Safaricom distributors monitor SIM card sales and activations. It streamlines tracking, quality control, and performance reporting by:

- Recording sold SIM serial numbers
- Uploading and matching against Safaricom activation reports
- Calculating performance and quality metrics
- Generating reports for team evaluation

---

## 💼 Business Use Case

Distributors sell SIM cards via multiple teams. This system ensures:

- Each team's sales and activations are monitored
- Quality SIMs (top-up ≥ 50 KES) are identified
- Team leaders can onboard, manage, and assess their staff
- Admins maintain system-wide control, validation, and reporting

---

## 🔧 Tech Stack

| Layer         | Technology                      |
|--------------|----------------------------------|
| Frontend     | [Next.js (App Router)](https://nextjs.org/docs/app) + [Tailwind CSS](https://tailwindcss.com) |
| Backend/API  | [Supabase](https://supabase.com) (Auth, DB, Storage, Functions) |
| Database     | PostgreSQL (via Supabase)        |
| Auth         | Supabase Auth (JWT + RLS)        |
| File Storage | Supabase Storage (ID documents, report files) |
| Deployment   | Vercel / Supabase / Any cloud    |

---

## 📚 Key Features

### ✅ SIM Card Recording
- Record serial numbers individually or in bulk (CSV/Excel)
- QR Code scanning support
- Input validation with error handling

### 📊 Reporting & Performance Tracking
- Match sold SIMs with Safaricom reports
- Identify **Matched** vs **Unmatched**
- Flag **Quality SIMs** (top-up ≥ 50 KES)
- Team and staff-based performance summaries
- Export data to Excel/CSV/PDF

### 📁 Report Uploading
- Upload Safaricom reports (CSV/Excel)
- Automated matching process
- Fraud detection flags and quality rating

### 👥 User & Team Management
- Admin, Team Leader, and Staff roles
- Role-based dashboard access
- Onboarding workflows and approval system

---

## 🧠 Data Models (Simplified)

### Users
- Role-based: `ADMIN`, `TEAM_LEADER`, `VAN_STAFF`, etc.
- Fields: `fullName`, `phoneNumber`, `idNumber`, `mobigoNumber`, `idFrontUrl`, `status`, etc.

### Teams
- Fields: `teamName`, `teamLeader`, `region`, `territory`, etc.

### SIM Cards
- Status: `MATCHED`, `UNMATCHED`, `QUALITY`, `NOT_QUALITY`
- Activation data, top-up amounts, fraud flags, etc.

### Reports
- Upload metadata
- Matching & quality counts
- Processing status

### Logs & Requests
- Onboarding/deletion workflows
- System activity logs

---

## 🔐 User Roles

| Role             | Capabilities                                                                 |
|------------------|------------------------------------------------------------------------------|
| Admin            | Manage all users, upload reports, generate full reports                      |
| Team Leader      | Manage team members, submit onboarding, upload team reports, view metrics    |
| Van Staff / Agent| Record SIM cards, view personal performance                                  |

---

## 📂 File Formats

### SIM Card Upload (CSV/Excel)
