package com.cinex.config;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path postsDir = MediaUploadPaths.postsDirectory();
        Path avatarsDir = MediaUploadPaths.avatarsDirectory();
        Path uploadRoot = postsDir.getParent();
        try {
            Files.createDirectories(postsDir);
            Files.createDirectories(avatarsDir);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        String location = uploadRoot.toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}

