package com.cinex.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.cinex.entity.*;
import com.cinex.repository.*;
import com.cinex.dto.BookingRequest;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingSeatRepository bookingSeatRepository;
    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final ShowtimeRepository showtimeRepository;
    private final ComboRepository comboRepository;
    private final BookingComboRepository bookingComboRepository;

    public Booking create(User user, BookingRequest req) {
        Long showtimeId = req.getShowtimeId();
        List<Long> seatIds = req.getSeatIds();

        Showtime showtime = showtimeRepository.findById(showtimeId).orElseThrow(() -> new RuntimeException("Showtime not found"));

        for (Long seatId : seatIds) {
            if (bookingSeatRepository.existsBySeatIdAndShowtimeId(seatId, showtime.getId())) {
                throw new RuntimeException("Seat already booked");
            }
        }

        BigDecimal totalSeatsPrice = showtime.getPrice().multiply(BigDecimal.valueOf(seatIds.size()));
        
        BigDecimal totalCombosPrice = BigDecimal.ZERO;
        if (req.getCombos() != null && !req.getCombos().isEmpty()) {
            for (BookingRequest.ComboRequest cr : req.getCombos()) {
                Combo c = comboRepository.findById(cr.getComboId()).orElseThrow(() -> new RuntimeException("Combo not found"));
                BigDecimal itemTotal = c.getPrice().multiply(BigDecimal.valueOf(cr.getQuantity()));
                totalCombosPrice = totalCombosPrice.add(itemTotal);
            }
        }
        
        BigDecimal totalPrice = totalSeatsPrice.add(totalCombosPrice);

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

        // save booking combos
        if (req.getCombos() != null && !req.getCombos().isEmpty()) {
            for (BookingRequest.ComboRequest cr : req.getCombos()) {
                Combo c = comboRepository.findById(cr.getComboId()).orElseThrow(() -> new RuntimeException("Combo not found"));
                BookingCombo bc = new BookingCombo();
                bc.setBooking(b);
                bc.setCombo(c);
                bc.setQuantity(cr.getQuantity());
                bc.setPrice(c.getPrice());
                bookingComboRepository.save(bc);
            }
        }

        return b;
    }

    public List<Booking> getBookingsByUser(User user) {
        return bookingRepository.findByUserId(user.getId());
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
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
