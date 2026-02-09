# Secure Authentication System with Cyber Defense

## 📌 Project Goal
To build a secure web authentication system that not only facilitates user login but actively **detects and blocks real-world cyber attacks** using industry-standard defenses.

> **Resume Line**: Secure Authentication System with Attack Analysis - Designed and implemented a secure login system with password hashing, brute-force attack prevention, SQL injection mitigation, and session security. Studied real-world web authentication vulnerabilities and defenses.

---

## 🛡️ Security & Cyber Defense Analysis

### 1. Brute Force Attack
- **Attack**: Attackers use automated scripts to try millions of password combinations.
- **My Defense**: **Account Lockout Mechanism**.
    - The system tracks failed login attempts.
    - After **5 failed attempts**, the account is **locked for 15 minutes**.
    - Logging: All failed attempts and lock events are logged to the `security_logs` database table.

### 2. SQL Injection (SQLi)
- **Attack**: Injecting malicious SQL code into input fields to bypass authentication (e.g., `' OR '1'='1`).
- **My Defense**: **Prepared Statements**.
    - Used `mysql2` parameterized queries.
    - Inputs are treated as data, never as executable code.
    - **Outcome**: Malicious inputs are rendered harmless.

### 3. Session Hijacking (XSS & Man-in-the-Middle)
- **Attack**: Stealing session cookies to impersonate users.
- **My Defense**: **HttpOnly & Secure Cookies**.
    - **HttpOnly**: JavaScript cannot access the cookie (prevents XSS theft).
    - **Secure**: Cookies are only sent over HTTPS (in production).
    - **JWT**: Stateless, signed tokens ensure data integrity.

### 4. Plain Text Password Theft
- **Attack**: If the database is compromised, passwords are readable.
- **My Defense**: **Bcrypt Hashing**.
    - Passwords are salted and hashed before storage.
    - Even DB admins cannot read the actual passwords.

---

## 🏗️ System Architecture

### Tech Stack
- **Frontend**: HTML5, CSS3 (Premium Dark UI), Vanilla JS.
- **Backend**: Node.js, Express.js.
- **Database**: MySQL.
- **Security**: Helmet (Headers), Rate-Limit (DDoS protection), Bcrypt, JWT.

### Workflow
1. **User Login** -> **Rate Limiter** checks IP -> **Controller** verifies credentials.
2. **Success** -> Issue JWT in HttpOnly Cookie -> Log "LOGIN_SUCCESS".
3. **Failure** -> Increment Counter -> Log "LOGIN_FAIL" -> Lock if threshold met.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- Node.js installed.
- MySQL installed and running.

### 2. Database Setup
Execute the SQL script in your MySQL client (Workbench, CLI, etc.):
```sql
SOURCE database_setup.sql;
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=secure_login_system
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

### 4. Install & Run
```bash
npm install
npm start
```
Visit `http://localhost:3000`

---

## 🧪 Verification Steps (Try breaking it!)

1. **Test Lockout**: Try logging in with a wrong password 5 times. You will see "Account is locked".
2. **Test SQLi**: Enter `' OR 1=1 --` as the email. It will fail safely.
3. **Check Logs**: Check the `security_logs` table in MySQL to see your failed attempts recorded.
