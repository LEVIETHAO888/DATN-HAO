package com.phimnet.controller;

import com.phimnet.entity.Movie;
import com.phimnet.entity.Showtime;
import com.phimnet.service.MovieService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping
    public List<Movie> getAllMovies(@RequestParam(required = false) Long cinemaId) {
        if (cinemaId != null) {
            return movieService.getMoviesForCinema(cinemaId);
        }
        return movieService.getAllMovies();
    }

    @GetMapping("/{id}")
    public Movie getMovie(@PathVariable Long id) {
        return movieService.getMovieById(id);
    }

    @GetMapping("/{id}/showtimes")
    public List<Showtime> getShowtimes(
            @PathVariable Long id,
            @RequestParam(required = false) Long cinemaId) {
        return movieService.getShowtimesByMovie(id, cinemaId);
    }
}