package com.phimnet.controller;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.phimnet.config.MediaUploadPaths;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/uploads")
public class PostMediaUploadController {

    private static final Logger log = LoggerFactory.getLogger(PostMediaUploadController.class);

    private static final long MAX_BYTES = 104_857_600; // 100 MB (khớp application.properties)

    @PostMapping("/post-media")
    public ResponseEntity<Map<String, String>> uploadPostMedia(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa có file");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File quá lớn (tối đa 100MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null
                || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận ảnh hoặc video");
        }

        String ext = extensionFrom(file.getOriginalFilename(), contentType);
        String filename = UUID.randomUUID() + "." + ext;

        Path dir = MediaUploadPaths.postsDirectory();
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            // transferTo(File|Path) hay lỗi trên Windows (file tạm / ổ đĩa); copy stream ổn định hơn
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Lưu file upload thất bại: dir={}", dir, e);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không lưu được file. Kiểm tra quyền ghi thư mục: " + dir);
        }

        String base = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        String url = base + "/uploads/posts/" + filename;

        Map<String, String> body = new HashMap<>();
        body.put("url", url);
        return ResponseEntity.ok(body);
    }

    private static String extensionFrom(String originalName, String contentType) {
        if (originalName != null && originalName.contains(".")) {
            String e = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
            if (e.matches("[a-z0-9]{1,8}")) {
                return e;
            }
        }
        if (contentType.contains("jpeg")) {
            return "jpg";
        }
        if (contentType.contains("png")) {
            return "png";
        }
        if (contentType.contains("gif")) {
            return "gif";
        }
        if (contentType.contains("webp")) {
            return "webp";
        }
        if (contentType.contains("mp4")) {
            return "mp4";
        }
        if (contentType.contains("webm")) {
            return "webm";
        }
        if (contentType.contains("quicktime") || contentType.contains("mov")) {
            return "mov";
        }
        return "bin";
    }
}
