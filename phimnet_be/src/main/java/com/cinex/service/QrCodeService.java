package com.cinex.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class QrCodeService {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";

    @Value("${app.qr.secret}")
    private String qrSecret; // phải đúng 32 ký tự (AES-256)

    // ─── Mã hóa ────────────────────────────────────────────────────────────────

    /**
     * Mã hóa bookingId thành token AES-256-CBC, trả về chuỗi Base64-URL-safe.
     * Format plaintext: "CINEX-TICKET:<bookingId>"
     */
    public String encryptTicketId(Long bookingId) {
        try {
            String plaintext = "CINEX-TICKET:" + bookingId;
            byte[] keyBytes = qrSecret.getBytes(StandardCharsets.UTF_8); // 32 bytes
            SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");

            // IV = 16 byte đầu của key (đủ dùng cho internal QR; dùng random IV nếu cần bảo mật cao hơn)
            byte[] ivBytes = new byte[16];
            System.arraycopy(keyBytes, 0, ivBytes, 0, 16);
            IvParameterSpec iv = new IvParameterSpec(ivBytes);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, iv);
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Base64-URL-safe để nhúng an toàn vào QR
            return Base64.getUrlEncoder().withoutPadding().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Không thể mã hóa ticket ID: " + bookingId, e);
        }
    }

    // ─── Giải mã ───────────────────────────────────────────────────────────────

    /**
     * Giải mã token Base64-URL-safe từ QR → trả về Long bookingId.
     * Ném RuntimeException nếu token không hợp lệ.
     */
    public Long decryptTicketToken(String token) {
        try {
            byte[] keyBytes = qrSecret.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");

            byte[] ivBytes = new byte[16];
            System.arraycopy(keyBytes, 0, ivBytes, 0, 16);
            IvParameterSpec iv = new IvParameterSpec(ivBytes);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, iv);
            byte[] decrypted = cipher.doFinal(Base64.getUrlDecoder().decode(token));

            String plaintext = new String(decrypted, StandardCharsets.UTF_8);
            if (!plaintext.startsWith("CINEX-TICKET:")) {
                throw new RuntimeException("QR token không hợp lệ");
            }
            return Long.parseLong(plaintext.substring("CINEX-TICKET:".length()));
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Không thể giải mã QR token", e);
        }
    }

    // ─── Tạo QR ────────────────────────────────────────────────────────────────

    /**
     * Tạo QR Code PNG từ nội dung văn bản.
     */
    public byte[] generateQrCode(String content, int width, int height)
            throws WriterException, IOException {

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.MARGIN, 1);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, width, height, hints);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", out);
        return out.toByteArray();
    }

    /**
     * Sinh QR Code cho một booking ID (300×300):
     * - Mã hóa bookingId → token AES-256
     * - Nhúng token vào QR
     */
    public byte[] generateTicketQr(Long bookingId) {
        try {
            String encryptedToken = encryptTicketId(bookingId);
            return generateQrCode(encryptedToken, 300, 300);
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Không thể tạo QR code cho booking " + bookingId, e);
        }
    }
}
