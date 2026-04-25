package com.cinex.service;

import com.cinex.dto.MovieReviewDTO;
import com.cinex.entity.Movie;
import com.cinex.repository.MovieRepository;
import com.cinex.entity.MovieReview;
import com.cinex.entity.User;
import com.cinex.repository.MovieReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieReviewService {

    private final MovieReviewRepository reviewRepository;
    private final MovieRepository movieRepository;

    private void updateMovieRating(Long movieId) {
        Double avg = getAverageRating(movieId);
        movieRepository.findById(movieId).ifPresent(movie -> {
            movie.setRating(avg);
            movieRepository.save(movie);
        });
    }

    public List<MovieReviewDTO> getReviewsByMovie(Long movieId) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public MovieReviewDTO addOrUpdateReview(Long movieId, User user, Integer rating, String content) {
        if (rating == null || rating < 1 || rating > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Điểm đánh giá phải từ 1 đến 10");
        }

        Optional<MovieReview> existing = reviewRepository.findByMovieIdAndUserId(movieId, user.getId());
        MovieReview review = existing.orElse(new MovieReview());
        review.setMovieId(movieId);
        review.setUser(user);
        review.setRating(rating);
        review.setContent(content != null ? content.trim() : "");
        review = reviewRepository.save(review);
        updateMovieRating(movieId);
        return toDTO(review);
    }

    public void deleteReview(Long reviewId, User user) {
        MovieReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));
        if (!review.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền xóa đánh giá này");
        }
        Long movieId = review.getMovieId();
        reviewRepository.delete(review);
        updateMovieRating(movieId);
    }

    public Double getAverageRating(Long movieId) {
        Double avg = reviewRepository.getAverageRatingByMovieId(movieId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : null;
    }

    public long getReviewCount(Long movieId) {
        return reviewRepository.countByMovieId(movieId);
    }

    public MovieReviewDTO getUserReview(Long movieId, Long userId) {
        return reviewRepository.findByMovieIdAndUserId(movieId, userId)
                .map(this::toDTO)
                .orElse(null);
    }

    private MovieReviewDTO toDTO(MovieReview r) {
        MovieReviewDTO dto = new MovieReviewDTO();
        dto.setId(r.getId());
        dto.setUserId(r.getUser().getId());
        dto.setUsername(r.getUser().getUsername());
        dto.setRating(r.getRating());
        dto.setContent(r.getContent());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        return dto;
    }
}
