# Secure Authentication System with Cyber Defense
> **A Next-Gen Identity & Access Management (IAM) System with Real-time Threat Detection.**

This project is a **comprehensive cybersecurity platform** designed to secure user identities by moving beyond static passwords. It implements an **Adaptive Risk Engine** that continuously evaluates user behavior, device fingerprints, and network telemetry to calculate a dynamic "Risk Score" for every identity.

---

## ❓ Why We Implemented This?

Traditional authentication (Username + Password) is broken.
-   **Static passwords** are easily stolen (Credential Stuffing).
-   **Simple locks** annoy legitimate users.
-   **Reactive security** (checking logs after a hack) is too late.

**The Solution:** An **Adaptive Security Model**.
Instead of treating all logins equally, this system asks: *"Is this login suspicious?"*
If a user logs in from a new device, at 3 AM, with 5 previous failed attempts, the system **automatically reacts** (increases risk score, challenges user, or blocks access) *before* damage is done.

---

## ⚙️ How It Works (The Workflow)

### 1. The Login Flow (Adaptive Auth)
1.  **User Enters Credentials**: System verifies email/password (`bcrypt` hash check).
2.  **Risk Engine Analysis**: Before granting access, the system checks:
    -   Is this a **New Device**?
    -   Is the IP address **Blacklisted**?
    -   Has the user had **Multiple Failed Attempts** recently?
3.  **Decision Gate**:
    -   🟢 **Risk Score < 30**: Allow Login (Seamless).
    -   🟡 **Risk Score 30-70**: Flag as "Moderate Risk" (In real-world: Trigger MBA/CAPTCHA).
    -   🔴 **Risk Score > 70**: **BLOCK ACCESS** immediately & Alert SOC.
4.  **Session Creation**: If allowed, a secure `HttpOnly` cookie is issued (immune to XSS attacks).

### 2. The SOC Feedback Loop
1.  **Real-time Monitoring**: The **SOC Command Center** watches every event.
2.  **Visualizing Threats**: Admins see live attack maps and risk heatmaps.
3.  **Automated Response**: High-risk users are highlighted for manual review or auto-lockdown.

---

## 🚀 Key Features

### 🧠 1. Adaptive Risk Scoring Engine
-   Calculates a live **0-100 Risk Score** for every user.
-   Increases score based on specific triggers:
    -   `LOGIN_FAIL`: +10 points
    -   `NEW_DEVICE`: +20 points
    -   `BRUTE_FORCE_DETECTED`: +50 points
-   Scores decay over time (mock implementation) to allow user rehabilitation.

### 🖥️ 2. SOC Command Center (Admin Dashboard)
A cyberpunk-themed interface for Security Operations Center (SOC) analysts.
-   **Live Terminal Log**: Matrix-style feed of security events (`/api/admin/events`).
-   **Threat Distribution Chart**: Visual breakdown of attack types (SQLi, Brute Force, etc.).
-   **Identity Risk Heatmap**: Real-time list of users with elevated risk levels.

### 👤 3. Personal Security Center (User Dashboard)
Empowers users to own their security.
-   **Live Identity Risk Meter**: Shows the user their own current threat status.
-   **Security Checklist**: Verifies password strength, network monitoring, and device trust.

### 🔐 4. Enterprise-Grade Security
-   **HttpOnly Cookies**: Prevents Session Hijacking via XSS.
-   **Helmet.js**: Sets secure HTTP headers (HSTS, No-Sniff, X-Frame-Options).
-   **Rate Limiting**: Blocks IPs that spam requests (DDoS / Brute Force protection).
-   **Password Policy**: Enforces NIST guidelines (Min 8 chars, Upper, Lower, Symbol).

---

## 🛠️ Tech Stack

-   **Backend**: Node.js, Express.js
-   **Database**: MySQL (Relational Schema for Users, Logs, Risk Scores)
-   **Security Modules**: `bcrypt`, `jsonwebtoken` (JWT), `helmet`, `express-rate-limit`
-   **Frontend**: HTML5, Vanilla CSS (Glassmorphism/Cyberpunk Design), Chart.js
-   **DevOps**: PM2/Nodemon, Git

---

## ⚙️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/vishvaparmar24/Secure-Authentication-System-with-Cyber-Defense.git
    cd Secure-Authentication-System-with-Cyber-Defense
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Database**
    -   Create a MySQL database named `secure_login_system`.
    -   Run the command in `database_setup.sql` to create tables.
    -   Run the command in `database_upgrade.sql` to add the Risk Engine tables.

4.  **Environment Variables**
    Create a `.env` file:
    ```
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=secure_login_system
    JWT_SECRET=super_secret_key_change_me
    NODE_ENV=development
    ```

5.  **Run the Platform**
    ```bash
    npm start
    ```
    -   **User Portal**: `http://localhost:3000`
    -   **SOC Dashboard**: Login -> Click "View SOC Threat Map" (or go to `http://localhost:3000/admin_soc.html` if permitted).

---

## 🛡️ Security Architecture Overview

| Layer | Defense Mechanism | Purpose |
| :--- | :--- | :--- |
| **Network** | Rate Limiting | Stop automated bots & DDoS |
| **Transport** | HTTPS (Secure Cookie) | Prevent Man-in-the-Middle attacks |
| **Application** | Helmet.js Headers | Prevent XSS, Clickjacking |
| **Identity** | Risk Engine | Detect compromised accounts behaviorally |
| **Data** | Salted Hashing (Bcrypt) | Protect passwords in case of DB breach |

---

### 👨‍💻 Author
**Vishva Parmar**
*Cybersecurity Engineer & Full Stack Developer*
