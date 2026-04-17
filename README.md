![CI](https://github.com/Vyroxes/virtual-library-app/actions/workflows/ci.yml/badge.svg)

🇵🇱 [Polish version](README_PL.md)

## 📚 Virtual Library App

A full-featured web application for managing a personal virtual library, built with a modern backend architecture and strong focus on security, scalability, and user experience.

---

## 🚀 Overview

The application allows users to create and manage their own book collections and wishlists. It supports both traditional authentication and OAuth login via GitHub and Discord.

Users can:
* manage books (add, edit, delete)
* import data via ISBN or JSON
* rate and review books
* browse other user profiles
* purchase premium plans

Administrators have access to advanced user management features.

---

## ✨ Key Features

### 👤 Authentication & Security

* JWT-based authentication (access + refresh tokens)
* Token blacklist mechanism (logout invalidation)
* OAuth login (GitHub, Discord) with account linking
* Secure password hashing (bcrypt)
* Environment-based configuration (.env)

### 📚 Book Management

* Add books manually, via ISBN, or JSON import
* Edit and delete books
* Move books between collection and wishlist
* Prevent duplicate entries (e.g. ISBN validation)

### 🖼️ Image Search
* Integration with **Google Custom Search**
* Allows searching for book cover images when adding a book

### 🤖 AI Assistance
* Integration with **OpenRouter API**
* Uses **DeepSeek Chat v3 0324 (free)**
* Automatically fills book metadata (genres, publisher, publication date, description, etc.)

### ⭐ Reviews & Ratings

* Add ratings and reviews
* Store user opinions for each book

### 🔍 Search & Filtering

* Search by title or author
* Sort by multiple fields (title, author, date, rating, etc.)
* Filter by genre, year, and page count

### 👥 Social Features

* View other users’ profiles
* User statistics (e.g. number of books)

### 💳 Payments

* Integration with Stripe
* PREMIUM and PREMIUM+ subscription plans
* Upgrade/downgrade logic

### 📊 Logging
* Backend request logging to logs.txt
* Logs every incoming request (method, endpoint, timestamps)
* Useful for debugging and monitoring

### 🛠️ Admin Panel

* View and manage users
* Modify user roles and subscription plans
* Access system-level information

### 📩 Contact System

* Built-in contact form for user support

---

## 🧱 System Architecture

The application follows a client-server architecture
* Frontend (React) communicates with backend via REST API
* Backend (Flask) handles business logic, authentication, and data processing
* Database (SQLite) stores users, books, reviews, and subscriptions

External services:
* OpenRouter (AI features)
* Google Custom Search (images)
* Stripe (payments)
* OAuth providers (GitHub, Discord)

---

### Backend Architecture

The backend follows a structured **MVC-like architecture (REST API only)**:
```
backend/
├── controllers/
├── models/
├── routes/
├── tests/
├── config/
├── app.py
```

* Controllers – business logic
* Models – database structure (ORM)
* Routes – API endpoints
* Tests – unit & integration tests

---

## 🛠️ Technologies

### Backend

* Python 3.12
* Flask (REST API)
* SQLAlchemy (ORM)
* SQLite (database)

### Authentication & Security

* Flask-JWT-Extended
* Flask-Bcrypt
* Flask-Talisman
* Flask-Limiter
* Flask-CORS

### OAuth

* Authlib (GitHub)
* Flask-Discord

### Payments

* Stripe API

### Utilities

* dotenv
* datetime / pytz
* regex (re)
* urllib
* os
* json

### Testing

* Pytest (integration tests)
* Unittest (unit tests)
* Postman (API testing)

---

## 🔐 Security Highlights

* JWT validation on every request
* Token expiration & refresh mechanism
* Token blacklist for logout handling
* Rate limiting (anti-DDoS / brute force)
* Secure HTTP headers (Talisman)
* CORS protection
* Request size limiting (2 MB)
* Disabled unsafe headers
* Sensitive data stored in environment variables

---

## 📡 API

* ~26 REST endpoints
* Methods: `GET`, `POST`, `PATCH`, `DELETE`
* Token-based authentication via headers & cookies

---

## 🧪 Testing

* Unit tests for core logic
* Integration tests for endpoints
* API testing with Postman

---

## 🧰 Requirements and Installation

### Required libraries

* `Authlib` – library for handling OAuth authentication (e.g. GitHub, Discord) and authorization
* `bcrypt` – tool for secure password hashing
* `Flask` – lightweight web framework for building Python APIs
* `Flask-Bcrypt` – Flask integration for bcrypt password hashing
* `Flask-Cors` - enables Cross-Origin Resource Sharing
* `Flask-Discord` – integration for Discord OAuth login
* `Flask-JWT-Extended` – handles JSON Web Tokens (JWT) for authentication and authorization
* `Flask-Limiter` – provides rate limiting to protect against abuse and attacks
* `Flask-SQLAlchemy` – Flask integration with SQLAlchemy ORM for database management
* `Flask-Talisman` – adds security headers and enforces HTTPS
* `python-dotenv` – loads environment variables from a `.env` file
* `pytz` – timezone handling library
* `requests` – library for making HTTP requests to external APIs
* `SQLAlchemy` – Object-Relational Mapping (ORM) library for database interaction
* `stripe` – integration with Stripe payment processing API
* `pytest` – framework for writing and running tests

### Run with Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

### Installing dependencies

You can install them individually with specific versions:
```bash
pip install Authlib==1.6.9 bcrypt==5.0.0 Flask==3.1.3 Flask-Bcrypt==1.0.1 Flask-Cors==6.0.2 Flask-Discord==0.1.69 Flask-JWT-Extended==4.7.1 Flask-Limiter==4.1.1 Flask-SQLAlchemy==3.1.1 Flask-Talisman==1.1.0 python-dotenv==1.2.2 pytz==2026.1.post1 requests==2.33.0 SQLAlchemy==2.0.48 stripe==15.0.0 pytest==8.4.2
```

Or using `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Installation

Backend:
```bash
git clone https://github.com/Vyroxes/BD_Projekt.git
cd BD_Projekt
python -m venv venv
source venv/bin/activate
```

Frontend:
```bash
cd src
npm install
```

Create `.env` file:
```
JWT_SECRET_KEY=
JWT_REFRESH_TOKEN_SECRET_KEY=
FLASK_SECRET_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=http://localhost:5000/api/auth/discord
GOOGLE_CS_API_KEY=
GOOGLE_CS_ID=
OPENROUTER_API_KEY=
URL=http://localhost
VITE_API_URL=http://localhost:5000
VITE_ADMIN_USERNAME=
ADMIN_USERNAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Run the app:

Backend:
```bash
flask run
```

`http://localhost:5000`

Frontend:
```bash
cd src
npm run dev
```

`http://localhost:5173`

---

## 🧠 Future Improvements

* Switch to PostgreSQL for production-grade data storage and scalability
* Add Docker support for containerized deployment
* Implement CI/CD pipeline (e.g. GitHub Actions) for automated testing and deployment
* Deploy frontend (React) using a production-ready platform (e.g. Vercel, Netlify) and connect it with the backend API
* Add email verification and two-factor authentication (2FA) for enhanced security
* Improve caching and performance (e.g. Redis integration)
* Extend OAuth authentication by adding additional providers (e.g. Google, Facebook, Microsoft) to improve user accessibility and login flexibility

---

## 📄 License

This project is for educational and portfolio purposes.

---

📌 Author: Michał Rusek (Vyroxes)