package com.cinex.config;

import java.nio.file.Path;
import java.nio.file.Paths;

/** Thư mục lưu media — trùng với static resource /uploads/** */
public final class MediaUploadPaths {

    private MediaUploadPaths() {}

    public static Path postsDirectory() {
        return Paths.get(System.getProperty("user.dir"), "uploads", "posts").toAbsolutePath().normalize();
    }

    public static Path avatarsDirectory() {
        return Paths.get(System.getProperty("user.dir"), "uploads", "avatars").toAbsolutePath().normalize();
    }
}

