package com.phimnet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phimnet.entity.Movie;

public interface MovieRepository extends JpaRepository<Movie, Long> {
}