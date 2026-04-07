package com.phimnet.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.phimnet.entity.*;
import com.phimnet.service.*;
import com.phimnet.dto.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public Booking createBooking(@RequestBody BookingRequest req, @AuthenticationPrincipal User user) {
        return bookingService.create(user, req.getShowtimeId(), req.getSeatIds());
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
}