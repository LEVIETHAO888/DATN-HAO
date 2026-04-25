package com.cinex.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MovieReviewDTO {
    private Long id;
    private Long userId;
    private String username;
    private Integer rating;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
