package com.cinex.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cinex.entity.Movie;
import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    List<Movie> findByStatus(String status);
}
