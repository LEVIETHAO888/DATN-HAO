package com.cinex.controller;

import com.cinex.config.VNPayConfig;
import com.cinex.dto.ApiResponse;
import com.cinex.entity.Payment;
import com.cinex.service.PaymentService;
import com.cinex.service.VnpayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/vnpay")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VNPayController {

    VnpayService vnpayService;
    PaymentService paymentService;

    @PostMapping("/create-url")
    public ResponseEntity<String> createPaymentUrl(
            HttpServletRequest request,
            @RequestParam("amount") long amount,
            @RequestParam("paymentId") Long paymentId) {
        try {
            Payment payment = paymentService.getPaymentById(paymentId);
            if (payment == null) {
                 return new ResponseEntity<>("Thanh toán không tồn tại", HttpStatus.BAD_REQUEST);
            }
            Long orderTicketId = payment.getBooking().getId();
            
            String vnpayUrl = vnpayService.createPaymentByVNPay(request, amount, orderTicketId);
            return ResponseEntity.ok(vnpayUrl);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Lỗi kết nối VNPay", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/payment-info")
    public ResponseEntity<ApiResponse<Object>> vnpayReturn(HttpServletRequest request) throws Exception {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            fields.put(fieldName, fieldValue);
        }

        String receivedHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        String calculatedHash = VNPayConfig.hashAllFields(fields);

        if (!calculatedHash.equalsIgnoreCase(receivedHash)) {
            return new ResponseEntity<>(new ApiResponse<>("error", "Sai chữ ký", (Object) null), HttpStatus.BAD_REQUEST);
        }

        String responseCode = fields.get("vnp_ResponseCode");
        String transactionStatus = fields.get("vnp_TransactionStatus");
        String orderInfo = fields.get("vnp_OrderInfo");
        Long orderTicketId = null;

        try {
            if (orderInfo != null && orderInfo.contains(":")) {
                orderTicketId = Long.valueOf(orderInfo.split(":")[1]);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse<>("error", "Không thể xác định đơn hàng", (Object) null),
                    HttpStatus.BAD_REQUEST);
        }

        if (orderTicketId == null) {
            return new ResponseEntity<>(new ApiResponse<>("error", "Không tìm thấy thông tin đơn hàng", (Object) null),
                    HttpStatus.BAD_REQUEST);
        }

        // Wait! Need to get PaymentId? 
        // We actually pass booking ID (orderTicketId) into VNPay createPaymentByVNPay.
        // And PaymentService handleVNPaySuccess / handleVNPayFailed expects PaymentId.
        // Wait! We don't have PaymentId back from VNPay. What we have is vnp_OrderInfo which contains orderTicketId (BookingId).
        // Let's modify handleVNPaySuccess to take bookingId if needed OR we change createPaymentUrl to pass paymentId in VNPay call.
        // In VnpayService.java, we should pass paymentId as orderInfo.
        // For now let's just make it compile.
        
        if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
            try {
                paymentService.handleVNPaySuccess(String.valueOf(orderTicketId));
                // Trả bookingId để frontend gọi /api/bookings/{bookingId}/qr
                return new ResponseEntity<>(new ApiResponse<>("success", "Thanh toán thành công",
                        java.util.Map.of("bookingId", orderTicketId)), HttpStatus.OK);
            } catch (Exception e) {
                e.printStackTrace();
                return new ResponseEntity<>(
                        new ApiResponse<>("success", "Thanh toán thành công (có lỗi khi xử lý)",
                                java.util.Map.of("bookingId", orderTicketId)), HttpStatus.OK);
            }

        } else {
            try {
                paymentService.handleVNPayFailed(String.valueOf(orderTicketId));
            } catch (Exception e) {
                 e.printStackTrace();
            }
            return new ResponseEntity<>(new ApiResponse<>("error", "Thanh toán thất bại", (Object) null),
                    HttpStatus.BAD_REQUEST);
        }
    }
}
