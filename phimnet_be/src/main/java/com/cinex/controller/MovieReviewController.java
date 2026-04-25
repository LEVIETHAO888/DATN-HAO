package com.cinex.controller;

import com.cinex.dto.MovieReviewDTO;
import com.cinex.entity.User;
import com.cinex.service.MovieReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/movies/{movieId}/reviews")
@RequiredArgsConstructor
public class MovieReviewController {

    private final MovieReviewService reviewService;

    /** GET /api/movies/{movieId}/reviews — public */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getReviews(@PathVariable Long movieId) {
        List<MovieReviewDTO> reviews = reviewService.getReviewsByMovie(movieId);
        Double avgRating = reviewService.getAverageRating(movieId);
        long count = reviewService.getReviewCount(movieId);

        Map<String, Object> result = new HashMap<>();
        result.put("reviews", reviews);
        result.put("averageRating", avgRating);
        result.put("totalReviews", count);
        return ResponseEntity.ok(result);
    }

    /** GET /api/movies/{movieId}/reviews/me — lấy review của user hiện tại */
    @GetMapping("/me")
    public ResponseEntity<MovieReviewDTO> getMyReview(
            @PathVariable Long movieId,
            @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.ok(null);
        MovieReviewDTO dto = reviewService.getUserReview(movieId, user.getId());
        return ResponseEntity.ok(dto);
    }

    /** POST /api/movies/{movieId}/reviews — thêm hoặc cập nhật review */
    @PostMapping
    public ResponseEntity<MovieReviewDTO> submitReview(
            @PathVariable Long movieId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        Integer rating = (Integer) body.get("rating");
        String content = (String) body.getOrDefault("content", "");
        MovieReviewDTO dto = reviewService.addOrUpdateReview(movieId, user, rating, content);
        return ResponseEntity.ok(dto);
    }

    /** DELETE /api/movies/{movieId}/reviews/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long movieId,
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        reviewService.deleteReview(id, user);
        return ResponseEntity.noContent().build();
    }
}
