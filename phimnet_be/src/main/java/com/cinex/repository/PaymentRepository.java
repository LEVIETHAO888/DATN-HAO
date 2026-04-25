package com.cinex.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cinex.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Payment findByBookingId(Long bookingId);
}
