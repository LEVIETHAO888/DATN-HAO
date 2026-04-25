package com.cinex.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.cinex.entity.*;
import com.cinex.repository.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final QrCodeService qrCodeService;
    private final EmailService emailService;

    public void handleVNPaySuccess(String paymentIdStr) {
        Long paymentId;
        try {
            paymentId = Long.parseLong(paymentIdStr);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid payment ID: " + paymentIdStr);
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        payment.setStatus("completed");

        Booking booking = payment.getBooking();
        booking.setStatus("confirmed");
        bookingRepository.save(booking);
        paymentRepository.save(payment);

        // ── Tạo QR + Gửi email xác nhận vé (bất đồng bộ, không block)
        try {
            String email = booking.getUser().getEmail();
            if (email != null && !email.isBlank()) {
                byte[] qrBytes = qrCodeService.generateTicketQr(booking.getId());
                emailService.sendTicketConfirmation(email, booking, qrBytes);
            }
        } catch (Exception e) {
            log.warn("⚠️ Không thể gửi email xác nhận vé #{}: {}", paymentId, e.getMessage());
        }
    }

    public void handleVNPayFailed(String paymentIdStr) {
        Long paymentId;
        try {
            paymentId = Long.parseLong(paymentIdStr);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid payment ID: " + paymentIdStr);
        }
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        payment.setStatus("failed");
        paymentRepository.save(payment);
    }

    public Payment createPayment(Long bookingId, String method) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getTotalPrice());
        payment.setMethod(method);
        payment.setStatus("pending");
        return paymentRepository.save(payment);
    }

    public Payment confirmPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        payment.setStatus("completed");
        payment.getBooking().setStatus("confirmed");
        bookingRepository.save(payment.getBooking());
        return paymentRepository.save(payment);
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id).orElse(null);
    }
}

