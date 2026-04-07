package com.phimnet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phimnet.entity.BookingSeat;
import java.util.List;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {
    boolean existsBySeatIdAndShowtimeId(Long seatId, Long showtimeId);
    List<BookingSeat> findByBookingId(Long bookingId);
    List<BookingSeat> findByShowtimeId(Long showtimeId);
}