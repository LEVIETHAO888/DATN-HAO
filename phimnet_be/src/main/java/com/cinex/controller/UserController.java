package com.cinex.controller;

import com.cinex.config.MediaUploadPaths;
import com.cinex.entity.User;
import com.cinex.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    /**
     * POST /api/users/me/password — Đổi mật khẩu
     */
    @PostMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Chưa đăng nhập"));
        }
        
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        if (oldPassword == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu hiện tại không chính xác"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    /**
     * PUT /api/users/me/profile — Cập nhật hồ sơ cá nhân (avatar + bio)
     */
    @PutMapping(value = "/me/profile", consumes = "multipart/form-data")
    public ResponseEntity<?> updateProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user,
            @RequestParam(value = "avatar", required = false) MultipartFile avatarFile,
            @RequestParam(value = "bio", required = false) String bio) {

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Chưa đăng nhập"));
        }

        // Cập nhật bio
        if (bio != null) {
            user.setBio(bio.trim().isEmpty() ? null : bio.trim());
        }

        // Upload avatar nếu có file
        if (avatarFile != null && !avatarFile.isEmpty()) {
            String originalFilename = avatarFile.getOriginalFilename();
            String ext = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            // Chỉ cho phép các định dạng ảnh hợp lệ
            String extLower = ext.toLowerCase();
            if (!extLower.equals(".jpg") && !extLower.equals(".jpeg")
                    && !extLower.equals(".png") && !extLower.equals(".webp") && !extLower.equals(".gif")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Chỉ chấp nhận file ảnh (jpg, png, webp, gif)"));
            }

            String filename = "user_" + user.getId() + "_" + System.currentTimeMillis() + ext;
            Path avatarsDir = MediaUploadPaths.avatarsDirectory();
            try {
                Files.createDirectories(avatarsDir);
                Path dest = avatarsDir.resolve(filename);
                Files.copy(avatarFile.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
                user.setAvatar("/uploads/avatars/" + filename);
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi lưu ảnh đại diện"));
            }
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "success", "data", toDTO(saved)));
    }

    /**
     * GET /api/users — Danh sách tất cả người dùng (admin)
     * GET /api/users?userId=X — Thông tin chi tiết 1 người dùng
     */
    @GetMapping
    public ResponseEntity<?> getUsers(@RequestParam(value = "userId", required = false) Long userId) {
        if (userId != null) {
            // Trả về 1 user cụ thể
            Optional<User> opt = userRepository.findById(userId);
            if (opt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Không tìm thấy người dùng"));
            }
            return ResponseEntity.ok(Map.of("status", "success", "data", toDTO(opt.get())));
        }

        // Trả về toàn bộ danh sách
        List<Map<String, Object>> list = userRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(list);
    }

    /**
     * GET /api/users/me — Thông tin user đang đăng nhập
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@org.springframework.security.core.annotation.AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Chưa đăng nhập"));
        }
        return ResponseEntity.ok(Map.of("status", "success", "data", toDTO(user)));
    }

    /**
     * Map User entity sang DTO phù hợp frontend
     */
    private Map<String, Object> toDTO(User user) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", user.getId());
        dto.put("userId", user.getId());
        dto.put("username", user.getUsername());
        dto.put("emailAddress", user.getEmail());
        dto.put("firstName", user.getUsername());
        dto.put("lastName", "");
        dto.put("roleId", user.getRole() != null ? user.getRole().getId() : 3);
        dto.put("roleName", user.getRole() != null ? user.getRole().getName() : "USER");
        dto.put("enabled", user.isEnabled());
        dto.put("avatar", user.getAvatar());
        dto.put("bio", user.getBio());
        dto.put("phoneNumber", null);
        dto.put("address", null);
        dto.put("dateOfBirth", null);
        return dto;
    }
}

