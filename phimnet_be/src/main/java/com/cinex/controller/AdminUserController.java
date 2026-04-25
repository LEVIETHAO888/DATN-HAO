package com.cinex.controller;

import com.cinex.entity.Role;
import com.cinex.entity.User;
import com.cinex.repository.RoleRepository;
import com.cinex.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Endpoints dành riêng cho Admin để quản lý trạng thái tài khoản người dùng.
 * Tất cả được bảo vệ bởi hasRole("ADMIN") trong SecurityConfig (/api/admin/**).
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * POST /api/admin/users — Tạo tài khoản Manager
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String email = (String) body.get("emailAddress");
        String rawPassword = (String) body.get("password");
        Object roleIdObj = body.get("roleId");

        if (username == null || email == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Thiếu thông tin bắt buộc"));
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Email đã tồn tại"));
        }
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Tên đăng nhập đã tồn tại"));
        }

        // Xác định role (mặc định MANAGER = 2)
        int roleId = 2;
        if (roleIdObj instanceof Number) roleId = ((Number) roleIdObj).intValue();
        String roleName = switch (roleId) {
            case 1 -> "ADMIN";
            case 2 -> "MANAGER";
            default -> "USER";
        };
        Role role = roleRepository.findByName(roleName);
        if (role == null) role = roleRepository.findByName("USER");

        // Tạo password ngẫu nhiên nếu không truyền
        String finalPassword = (rawPassword != null && !rawPassword.isBlank())
                ? rawPassword
                : UUID.randomUUID().toString().substring(0, 10);

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(finalPassword));
        user.setRole(role);
        user.setEnabled(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Tạo tài khoản thành công",
                "data", Map.of("emailAddress", email, "username", username)
        ));
    }

    /**
     * PUT /api/admin/users/{id}/lock   — Khóa tài khoản
     */
    @PutMapping("/{id}/lock")
    public ResponseEntity<?> lockUser(@PathVariable Long id) {
        return setEnabled(id, false);
    }

    /**
     * PUT /api/admin/users/{id}/unlock — Mở khóa tài khoản
     */
    @PutMapping("/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable Long id) {
        return setEnabled(id, true);
    }

    private ResponseEntity<?> setEnabled(Long id, boolean enabled) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        User u = opt.get();
        // Không cho phép khóa tài khoản ADMIN (roleId == 1)
        if (u.getRole() != null && u.getRole().getId() == 1) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Không thể khóa tài khoản Admin"));
        }
        u.setEnabled(enabled);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of(
                "message", enabled ? "Mở khóa thành công" : "Khóa thành công",
                "enabled", enabled
        ));
    }
}
