package com.phimnet.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.phimnet.entity.*;
import com.phimnet.service.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/booking/{bookingId}")
    public Payment createPayment(@PathVariable Long bookingId, @RequestParam String method) {
        return paymentService.createPayment(bookingId, method);
    }

    @PutMapping("/{id}/confirm")
    public Payment confirmPayment(@PathVariable Long id) {
        return paymentService.confirmPayment(id);
    }
}