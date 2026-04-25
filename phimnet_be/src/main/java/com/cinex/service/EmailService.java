package com.cinex.service;

import com.cinex.entity.Booking;
import com.cinex.entity.BookingSeat;
import com.cinex.repository.BookingSeatRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final BookingSeatRepository bookingSeatRepository;

    @Value("${app.email.from:CineX Tickets <noreply@cinex.com>}")
    private String fromAddress;

    /**
     * Gửi email xác nhận vé đặt phim kèm QR Code (chạy async để không block luồng chính).
     */
    @Async
    public void sendTicketConfirmation(String toEmail, Booking booking, byte[] qrBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // multipart = true, utf8 = true
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("🎬 CineX – Xác nhận đặt vé #" + booking.getId());

            // ── Thu thập thông tin ghế ngồi
            List<BookingSeat> seats = bookingSeatRepository.findByBookingId(booking.getId());
            String seatList = seats.stream()
                    .map(bs -> bs.getSeat().getSeatNumber())
                    .collect(Collectors.joining(", "));

            // ── Định dạng thời gian chiếu
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm – dd/MM/yyyy");
            String showtime = booking.getShowtime().getStartTime().format(fmt);

            String movieName  = booking.getShowtime().getMovie().getTitle();
            String cinemaName = booking.getShowtime().getRoom().getCinema().getName();
            String roomName   = booking.getShowtime().getRoom().getName();
            String totalPrice = String.format("%,.0f đ", booking.getTotalPrice().doubleValue());

            // ── HTML email body
            String html = buildEmailHtml(
                    booking.getId(),
                    movieName,
                    cinemaName,
                    roomName,
                    showtime,
                    seatList.isEmpty() ? "—" : seatList,
                    totalPrice
            );

            helper.setText(html, true);

            // ── Đính kèm QR code inline với CID "qrcode"
            if (qrBytes != null && qrBytes.length > 0) {
                helper.addInline("qrcode",
                        new org.springframework.core.io.ByteArrayResource(qrBytes),
                        "image/png");
            }

            mailSender.send(message);
            log.info("✅ Email xác nhận vé #{} đã gửi tới {}", booking.getId(), toEmail);

        } catch (MessagingException e) {
            log.error("❌ Không thể gửi email xác nhận vé #{}: {}", booking.getId(), e.getMessage(), e);
        }
    }

    // ─── HTML template ─────────────────────────────────────────────────────────
    private String buildEmailHtml(Long bookingId, String movie, String cinema,
                                  String room, String time, String seats, String total) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>Xác nhận vé CineX</title>
            </head>
            <body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="background:#0d1525;border-radius:20px;overflow:hidden;
                                border:1px solid rgba(255,255,255,0.08);max-width:600px;width:100%%;">

                    <!-- Header gradient bar -->
                    <tr><td style="height:5px;background:linear-gradient(90deg,#005BAA,#00aaff);"></td></tr>

                    <!-- Logo / brand -->
                    <tr><td align="center" style="padding:36px 40px 20px;">
                      <div style="display:inline-flex;align-items:center;gap:10px;">
                        <span style="font-size:28px;font-weight:900;letter-spacing:-1px;
                                     background:linear-gradient(135deg,#005BAA,#00aaff);
                                     -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                          🎬 CineX
                        </span>
                      </div>
                      <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Rạp chiếu phim hàng đầu Việt Nam</p>
                    </td></tr>

                    <!-- Success badge -->
                    <tr><td align="center" style="padding:0 40px 28px;">
                      <div style="display:inline-block;background:rgba(34,197,94,0.12);
                                  border:1px solid rgba(34,197,94,0.3);border-radius:50px;
                                  padding:10px 24px;color:#22c55e;font-weight:700;font-size:15px;">
                        ✅ Thanh toán thành công – Vé đã xác nhận
                      </div>
                    </td></tr>

                    <!-- Ticket info card -->
                    <tr><td style="padding:0 40px;">
                      <table width="100%%" cellpadding="0" cellspacing="0"
                             style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
                                    border-radius:16px;overflow:hidden;">
                        <tr><td style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.05);">
                          <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;
                                    letter-spacing:2px;font-weight:700;">Mã đặt vé</p>
                          <p style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:900;
                                    letter-spacing:2px;">#%s</p>
                        </td></tr>
                        %s
                        %s
                        %s
                        %s
                        %s
                        %s
                      </table>
                    </td></tr>

                    <!-- QR Code -->
                    <tr><td align="center" style="padding:32px 40px 16px;">
                      <p style="margin:0 0 16px;color:#6b7280;font-size:12px;text-transform:uppercase;
                                letter-spacing:2px;font-weight:700;">Mã QR – Xuất trình khi vào rạp</p>
                      <div style="display:inline-block;background:#fff;padding:16px;border-radius:16px;
                                  box-shadow:0 8px 32px rgba(0,91,170,0.3);">
                        <img src="cid:qrcode" width="200" height="200"
                             alt="QR Code vé #%s"
                             style="display:block;border-radius:8px;"/>
                      </div>
                      <p style="margin:12px 0 0;color:#4b5563;font-size:11px;">
                        Mã QR chứa thông tin: <strong style="color:#6b7280;">CINEX-TICKET:%s</strong>
                      </p>
                    </td></tr>

                    <!-- Warning note -->
                    <tr><td style="padding:0 40px 28px;">
                      <div style="background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.2);
                                  border-radius:12px;padding:14px 18px;">
                        <p style="margin:0;color:#fbbf24;font-size:12px;line-height:1.6;">
                          ⚠️ <strong>Lưu ý:</strong> Vui lòng xuất trình email hoặc mã QR này tại quầy soát vé.
                          Vé có giá trị một lần và không thể hoàn trả sau khi đã sử dụng.
                        </p>
                      </div>
                    </td></tr>

                    <!-- Footer -->
                    <tr><td style="height:1px;background:rgba(255,255,255,0.05);margin:0 40px;"></td></tr>
                    <tr><td align="center" style="padding:24px 40px;">
                      <p style="margin:0;color:#374151;font-size:12px;">
                        © 2026 CineX · Hệ thống đặt vé xem phim trực tuyến
                      </p>
                      <p style="margin:6px 0 0;color:#374151;font-size:11px;">
                        Email này được gửi tự động, vui lòng không trả lời.
                      </p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                bookingId,
                infoRow("🎬 Phim", movie),
                infoRow("🏢 Rạp", cinema),
                infoRow("🚪 Phòng", room),
                infoRow("🕐 Suất chiếu", time),
                infoRow("💺 Ghế", seats),
                infoRow("💰 Tổng tiền", "<span style='color:#22c55e;font-weight:700;'>" + total + "</span>"),
                bookingId, bookingId
        );
    }

    private String infoRow(String label, String value) {
        return """
            <tr><td style="padding:14px 24px;border-bottom:1px solid rgba(255,255,255,0.05);">
              <table width="100%%" cellpadding="0" cellspacing="0"><tr>
                <td style="color:#6b7280;font-size:13px;width:120px;">%s</td>
                <td style="color:#e5e7eb;font-size:13px;font-weight:600;text-align:right;">%s</td>
              </tr></table>
            </td></tr>
            """.formatted(label, value);
    }
}
