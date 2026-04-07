-- ================================
-- PHIMNET FULL DATABASE
-- Single source of truth for phimnet_be
-- ================================

DROP DATABASE IF EXISTS movie_social_db;
CREATE DATABASE movie_social_db;
USE movie_social_db;

-- ================================
-- 1. ROLES
-- ================================
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES
('ADMIN'),
('MANAGER'),
('USER');

-- ================================
-- 2. USERS
-- Password for all seeded users: 123456
-- BCrypt hash compatible with Spring Security
-- ================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    bio TEXT,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO users (username, email, password, avatar, bio, role_id) VALUES
('admin', 'admin@gmail.com', '$2a$10$zJVDevcbj97GTBsEPkjIL.GJWDSDASMaRIBebbDqL.Yp1hooYSKGy', NULL, 'Administrator account', 1),
('manager1', 'manager@gmail.com', '$2a$10$zJVDevcbj97GTBsEPkjIL.GJWDSDASMaRIBebbDqL.Yp1hooYSKGy', NULL, 'Cinema manager account', 2),
('user1', 'user1@gmail.com', '$2a$10$zJVDevcbj97GTBsEPkjIL.GJWDSDASMaRIBebbDqL.Yp1hooYSKGy', NULL, 'Movie fan account', 3),
('user2', 'user2@gmail.com', '$2a$10$zJVDevcbj97GTBsEPkjIL.GJWDSDASMaRIBebbDqL.Yp1hooYSKGy', NULL, 'Movie fan account', 3),
('user3', 'user3@gmail.com', '$2a$10$zJVDevcbj97GTBsEPkjIL.GJWDSDASMaRIBebbDqL.Yp1hooYSKGy', NULL, 'Movie fan account', 3);

-- ================================
-- 3. SOCIAL MODULE
-- ================================
CREATE TABLE posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content TEXT,
    media_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO posts (user_id, content, media_url, status) VALUES
(3, 'Hom nay di xem phim rat hay, ai co phim nao de cu nua khong?', NULL, 'approved'),
(4, 'Interstellar xem lai van rat da.', NULL, 'approved'),
(5, 'Dang doi phim moi cuoi tuan nay.', NULL, 'pending'),
(3, 'Vua xem Inception xong, plot twist qua dinh.', NULL, 'approved'),
(4, 'Your Name chieu lai ngoai rap thi toi dat ve ngay.', NULL, 'approved');

CREATE TABLE likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

INSERT INTO likes (user_id, post_id) VALUES
(4, 1),
(5, 1),
(3, 2),
(5, 4);

CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

INSERT INTO comments (user_id, post_id, content) VALUES
(4, 1, 'Chuan luon, review them di ban.'),
(5, 1, 'Ban xem suat may gio vay?'),
(3, 2, 'Phim nay soundtrack dinh thuc su.'),
(4, 4, 'Christopher Nolan luon biet cach lam nguoi xem dau dau.');

CREATE TABLE reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO reports (post_id, user_id, reason, status) VALUES
(3, 4, 'Noi dung qua ngan, can xem lai.', 'pending');

-- ================================
-- 4. MOVIE SYSTEM
-- Extra columns are kept for richer seed data.
-- Backend phimnet_be only requires title/description.
-- ================================
CREATE TABLE movies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT,
    genre VARCHAR(100),
    release_date DATE,
    poster_url VARCHAR(255),
    trailer_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'coming_soon'
);

INSERT INTO movies (title, description, duration, genre, release_date, poster_url, trailer_url, status) VALUES
('Avengers: Endgame', 'Sieu anh hung quy tu trong tran chien cuoi cung.', 180, 'Action', '2019-04-26', 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', 'https://www.youtube.com/watch?v=TcMBFSGVi1c', 'now_showing'),
('Spider-Man: No Way Home', 'Nguoi nhen va da vu tru mo rong.', 150, 'Action', '2021-12-17', 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', 'https://www.youtube.com/watch?v=JfVOs4VSpmA', 'now_showing'),
('Doraemon Movie', 'Hoat hinh Nhat Ban phu hop cho gia dinh.', 120, 'Animation', '2023-06-01', NULL, NULL, 'coming_soon'),
('Interstellar', 'Hanh trinh xuyen khong gian tim noi o moi cho loai nguoi.', 169, 'Sci-Fi', '2014-11-07', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 'https://www.youtube.com/watch?v=zSWdZVtXT7E', 'now_showing'),
('Inception', 'Vu trom y tuong trong cac tang giac mo chong chat.', 148, 'Sci-Fi', '2010-07-16', 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', 'https://www.youtube.com/watch?v=YoHD9XEInc0', 'now_showing'),
('Your Name', 'Cau chuyen hoan doi than xac va moi lien ket ky la.', 106, 'Animation', '2016-08-26', 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg', 'https://www.youtube.com/watch?v=xU47nhruN-Q', 'coming_soon');

CREATE TABLE cinemas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL
);

INSERT INTO cinemas (name, location) VALUES
('CGV Vincom', 'Ha Noi'),
('Lotte Cinema', 'Ho Chi Minh City');

CREATE TABLE rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cinema_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    total_seats INT NOT NULL,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
);

INSERT INTO rooms (cinema_id, name, total_seats) VALUES
(1, 'Phong 1', 50),
(1, 'Phong 2', 50),
(2, 'Phong A', 50);

CREATE TABLE seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    type VARCHAR(50) DEFAULT 'normal',
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

INSERT INTO seats (room_id, seat_number, type) VALUES
(1, 'A1', 'normal'),
(1, 'A2', 'normal'),
(1, 'A3', 'vip'),
(1, 'A4', 'normal'),
(1, 'A5', 'vip'),
(1, 'A6', 'normal'),
(1, 'A7', 'normal'),
(1, 'A8', 'normal'),
(1, 'A9', 'normal'),
(1, 'A10', 'normal'),
(1, 'B1', 'normal'),
(1, 'B2', 'normal'),
(1, 'B3', 'vip'),
(1, 'B4', 'vip'),
(1, 'B5', 'vip'),
(1, 'B6', 'vip'),
(1, 'B7', 'vip'),
(1, 'B8', 'vip'),
(1, 'B9', 'normal'),
(1, 'B10', 'normal'),
(1, 'C1', 'normal'),
(1, 'C2', 'normal'),
(1, 'C3', 'vip'),
(1, 'C4', 'vip'),
(1, 'C5', 'vip'),
(1, 'C6', 'vip'),
(1, 'C7', 'vip'),
(1, 'C8', 'vip'),
(1, 'C9', 'normal'),
(1, 'C10', 'normal'),
(1, 'D1', 'normal'),
(1, 'D2', 'normal'),
(1, 'D3', 'vip'),
(1, 'D4', 'vip'),
(1, 'D5', 'vip'),
(1, 'D6', 'vip'),
(1, 'D7', 'vip'),
(1, 'D8', 'vip'),
(1, 'D9', 'normal'),
(1, 'D10', 'normal'),
(1, 'E1', 'normal'),
(1, 'E2', 'normal'),
(1, 'E3', 'normal'),
(1, 'E4', 'normal'),
(1, 'E5', 'normal'),
(1, 'E6', 'normal'),
(1, 'E7', 'normal'),
(1, 'E8', 'normal'),
(1, 'E9', 'normal'),
(1, 'E10', 'normal'),
(2, 'A1', 'normal'),
(2, 'A2', 'normal'),
(2, 'A3', 'vip'),
(2, 'A4', 'normal'),
(2, 'A5', 'vip'),
(2, 'A6', 'normal'),
(2, 'A7', 'normal'),
(2, 'A8', 'normal'),
(2, 'A9', 'normal'),
(2, 'A10', 'normal'),
(2, 'B1', 'normal'),
(2, 'B2', 'normal'),
(2, 'B3', 'vip'),
(2, 'B4', 'vip'),
(2, 'B5', 'vip'),
(2, 'B6', 'vip'),
(2, 'B7', 'vip'),
(2, 'B8', 'vip'),
(2, 'B9', 'normal'),
(2, 'B10', 'normal'),
(2, 'C1', 'normal'),
(2, 'C2', 'normal'),
(2, 'C3', 'vip'),
(2, 'C4', 'vip'),
(2, 'C5', 'vip'),
(2, 'C6', 'vip'),
(2, 'C7', 'vip'),
(2, 'C8', 'vip'),
(2, 'C9', 'normal'),
(2, 'C10', 'normal'),
(2, 'D1', 'normal'),
(2, 'D2', 'normal'),
(2, 'D3', 'vip'),
(2, 'D4', 'vip'),
(2, 'D5', 'vip'),
(2, 'D6', 'vip'),
(2, 'D7', 'vip'),
(2, 'D8', 'vip'),
(2, 'D9', 'normal'),
(2, 'D10', 'normal'),
(2, 'E1', 'normal'),
(2, 'E2', 'normal'),
(2, 'E3', 'normal'),
(2, 'E4', 'normal'),
(2, 'E5', 'normal'),
(2, 'E6', 'normal'),
(2, 'E7', 'normal'),
(2, 'E8', 'normal'),
(2, 'E9', 'normal'),
(2, 'E10', 'normal'),
(3, 'A1', 'normal'),
(3, 'A2', 'normal'),
(3, 'A3', 'vip'),
(3, 'A4', 'normal'),
(3, 'A5', 'vip'),
(3, 'A6', 'normal'),
(3, 'A7', 'normal'),
(3, 'A8', 'normal'),
(3, 'A9', 'normal'),
(3, 'A10', 'normal'),
(3, 'B1', 'normal'),
(3, 'B2', 'normal'),
(3, 'B3', 'vip'),
(3, 'B4', 'vip'),
(3, 'B5', 'vip'),
(3, 'B6', 'vip'),
(3, 'B7', 'vip'),
(3, 'B8', 'vip'),
(3, 'B9', 'normal'),
(3, 'B10', 'normal'),
(3, 'C1', 'normal'),
(3, 'C2', 'normal'),
(3, 'C3', 'vip'),
(3, 'C4', 'vip'),
(3, 'C5', 'vip'),
(3, 'C6', 'vip'),
(3, 'C7', 'vip'),
(3, 'C8', 'vip'),
(3, 'C9', 'normal'),
(3, 'C10', 'normal'),
(3, 'D1', 'normal'),
(3, 'D2', 'normal'),
(3, 'D3', 'vip'),
(3, 'D4', 'vip'),
(3, 'D5', 'vip'),
(3, 'D6', 'vip'),
(3, 'D7', 'vip'),
(3, 'D8', 'vip'),
(3, 'D9', 'normal'),
(3, 'D10', 'normal'),
(3, 'E1', 'normal'),
(3, 'E2', 'normal'),
(3, 'E3', 'normal'),
(3, 'E4', 'normal'),
(3, 'E5', 'normal'),
(3, 'E6', 'normal'),
(3, 'E7', 'normal'),
(3, 'E8', 'normal'),
(3, 'E9', 'normal'),
(3, 'E10', 'normal');

CREATE TABLE showtimes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price) VALUES
(1, 1, '2026-04-01 18:00:00', '2026-04-01 21:00:00', 100000),
(2, 2, '2026-04-01 20:00:00', '2026-04-01 22:30:00', 120000),
(4, 1, '2026-04-02 18:30:00', '2026-04-02 21:19:00', 110000),
(5, 2, '2026-04-02 20:00:00', '2026-04-02 22:28:00', 115000),
(6, 3, '2026-04-03 19:00:00', '2026-04-03 20:46:00', 90000);

-- ================================
-- 5. BOOKING SYSTEM
-- Aligned with backend:
-- bookings.status => pending / cancelled / confirmed
-- booking_seats has showtime_id and unique(seat_id, showtime_id)
-- ================================
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    showtime_id BIGINT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
);

INSERT INTO bookings (user_id, showtime_id, total_price, status) VALUES
(3, 1, 200000, 'confirmed'),
(4, 2, 120000, 'pending');

CREATE TABLE booking_seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    showtime_id BIGINT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    UNIQUE (booking_id, seat_id),
    UNIQUE (seat_id, showtime_id)
);

INSERT INTO booking_seats (booking_id, seat_id, showtime_id) VALUES
(1, 1, 1),
(1, 2, 1),
(2, 8, 2);

-- ================================
-- 6. PAYMENTS
-- Aligned with backend:
-- status => pending / completed / failed
-- booking_id => unique because Payment is OneToOne
-- ================================
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

INSERT INTO payments (booking_id, amount, method, status) VALUES
(1, 200000, 'vnpay', 'completed'),
(2, 120000, 'momo', 'pending');

-- ================================
-- 7. QUICK CHECKS
-- ================================
SELECT id, username, email, role_id FROM users ORDER BY id;
SELECT id, title, status FROM movies ORDER BY id;
SELECT id, movie_id, room_id, start_time, price FROM showtimes ORDER BY id;
SELECT id, status, total_price FROM bookings ORDER BY id;
SELECT id, booking_id, status, method FROM payments ORDER BY id;


