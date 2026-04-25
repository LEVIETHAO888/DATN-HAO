package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password;

    /**
     * true  = tài khoản hoạt động bình thường
     * false = tài khoản bị khóa (không thể đăng nhập)
     */
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private boolean enabled = true;

    @ManyToOne
    private Role role;

    /** Đường dẫn tương đối ảnh đại diện, vd: /uploads/avatars/123.jpg */
    @Column(length = 512)
    private String avatar;

    /** Giới thiệu bản thân */
    @Column(columnDefinition = "TEXT")
    private String bio;
}
