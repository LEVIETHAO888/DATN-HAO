# CINEX BACKEND

## 🚀 Cách chạy

### 1. Tạo database

CREATE DATABASE movie_social_db;

### 2. Config DB

Sửa file application.properties

### 3. Run project

mvn spring-boot:run

---

## 🔐 Tài khoản test

[admin@gmail.com](mailto:admin@gmail.com) / 123456

---

## 📡 API chính

### Auth

POST /api/auth/login

### Post

POST /api/posts
GET /api/posts

### Booking

POST /api/bookings

### Payment

POST /api/payment/{bookingId}

---

## 🧠 Công nghệ

* Spring Boot
* MySQL
* JWT
