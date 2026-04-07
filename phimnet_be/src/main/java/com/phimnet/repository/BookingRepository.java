package com.phimnet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phimnet.entity.Booking;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByStatus(String status);
}