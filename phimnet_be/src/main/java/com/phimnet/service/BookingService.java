package com.phimnet.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.phimnet.entity.*;
import com.phimnet.repository.*;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingSeatRepository bookingSeatRepository;
    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final ShowtimeRepository showtimeRepository;

    public Booking create(User user, Long showtimeId, List<Long> seatIds) {
        Showtime showtime = showtimeRepository.findById(showtimeId).orElseThrow(() -> new RuntimeException("Showtime not found"));

        for (Long seatId : seatIds) {
            if (bookingSeatRepository.existsBySeatIdAndShowtimeId(seatId, showtime.getId())) {
                throw new RuntimeException("Seat already booked");
            }
        }

        BigDecimal totalPrice = showtime.getPrice().multiply(BigDecimal.valueOf(seatIds.size()));

        Booking b = new Booking();
        b.setUser(user);
        b.setShowtime(showtime);
        b.setTotalPrice(totalPrice);
        b.setStatus("pending");

        b = bookingRepository.save(b);

        // save booking seats
        for (Long seatId : seatIds) {
            Seat seat = seatRepository.findById(seatId).orElseThrow(() -> new RuntimeException("Seat not found"));
            BookingSeat bs = new BookingSeat();
            bs.setBooking(b);
            bs.setSeat(seat);
            bs.setShowtime(showtime);
            bookingSeatRepository.save(bs);
        }

        return b;
    }

    public List<Booking> getBookingsByUser(User user) {
        return bookingRepository.findByUserId(user.getId());
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id).orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    public void cancelBooking(Long bookingId) {
        Booking b = getBookingById(bookingId);
        b.setStatus("cancelled");
        bookingRepository.save(b);
    }
}
