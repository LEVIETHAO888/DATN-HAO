package com.phimnet.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.phimnet.entity.*;
import com.phimnet.repository.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    public Payment createPayment(Long bookingId, String method) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getTotalPrice());
        payment.setMethod(method);
        payment.setStatus("pending");
        return paymentRepository.save(payment);
    }

    public Payment confirmPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new RuntimeException("Payment not found"));
        payment.setStatus("completed");
        // update booking status
        payment.getBooking().setStatus("confirmed");
        bookingRepository.save(payment.getBooking());
        return paymentRepository.save(payment);
    }
}