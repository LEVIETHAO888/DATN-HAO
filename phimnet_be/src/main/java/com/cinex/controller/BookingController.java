package com.cinex.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.cinex.entity.*;
import com.cinex.service.*;
import com.cinex.dto.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final QrCodeService qrCodeService;

    @PostMapping
    public Booking createBooking(@RequestBody BookingRequest req, @AuthenticationPrincipal User user) {
        return bookingService.create(user, req);
    }

    @GetMapping
    public List<Booking> getMyBookings(@AuthenticationPrincipal User user) {
        return bookingService.getBookingsByUser(user);
    }

    @GetMapping("/{id}")
    public Booking getBooking(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    @PutMapping("/{id}/cancel")
    public void cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
    }

    /**
     * Trả về ảnh QR code PNG cho booking ID.
     * booking ID được mã hóa AES-256 trước khi nhúng vào QR.
     * GET /api/bookings/{id}/qr
     */
    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getBookingQr(@PathVariable Long id) {
        // Kiểm tra booking tồn tại
        bookingService.getBookingById(id); // ném RuntimeException nếu không tìm thấy
        byte[] qrBytes = qrCodeService.generateTicketQr(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .body(qrBytes);
    }

    /**
     * Xác minh QR code vé: giải mã token AES → trả về thông tin booking.
     * GET /api/bookings/verify-qr?token=<encrypted_token>
     */
    @GetMapping("/verify-qr")
    public ResponseEntity<Booking> verifyQr(@RequestParam String token) {
        Long bookingId = qrCodeService.decryptTicketToken(token);
        Booking booking = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(booking);
    }
}

