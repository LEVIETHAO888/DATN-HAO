package com.phimnet.config;

import java.nio.file.Path;
import java.nio.file.Paths;

/** Thư mục lưu media bài đăng — trùng với static resource /uploads/** */
public final class MediaUploadPaths {

    private MediaUploadPaths() {}

    public static Path postsDirectory() {
        return Paths.get(System.getProperty("user.dir"), "uploads", "posts").toAbsolutePath().normalize();
    }
}
