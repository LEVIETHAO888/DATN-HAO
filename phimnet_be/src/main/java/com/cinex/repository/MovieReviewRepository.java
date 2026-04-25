package com.cinex.repository;

import com.cinex.entity.MovieReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface MovieReviewRepository extends JpaRepository<MovieReview, Long> {

    List<MovieReview> findByMovieIdOrderByCreatedAtDesc(Long movieId);

    Optional<MovieReview> findByMovieIdAndUserId(Long movieId, Long userId);

    @Query("SELECT AVG(r.rating) FROM MovieReview r WHERE r.movieId = :movieId")
    Double getAverageRatingByMovieId(@Param("movieId") Long movieId);

    long countByMovieId(Long movieId);
}
