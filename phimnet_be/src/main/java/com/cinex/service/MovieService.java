package com.cinex.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cinex.entity.*;
import com.cinex.repository.*;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final ShowtimeRepository showtimeRepository;

    public Movie createMovie(Movie movie) {
        if (movie.getStatus() == null || movie.getStatus().isBlank()) {
            movie.setStatus("coming_soon");
        }
        return movieRepository.save(movie);
    }

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public List<Movie> getMoviesByStatus(String status) {
        return movieRepository.findByStatus(status);
    }

    /** Phim có ít nhất một suất chiếu tại rạp (qua phòng thuộc rạp). */
    public List<Movie> getMoviesForCinema(Long cinemaId) {
        List<Showtime> list = showtimeRepository.findByRoom_Cinema_Id(cinemaId);
        Set<Long> seen = new LinkedHashSet<>();
        List<Movie> out = new ArrayList<>();
        for (Showtime st : list) {
            Movie m = st.getMovie();
            if (m != null && seen.add(m.getId())) {
                out.add(m);
            }
        }
        return out;
    }

    public Movie getMovieById(Long id) {
        return movieRepository.findById(id).orElseThrow(() -> new RuntimeException("Movie not found"));
    }

    public List<Showtime> getShowtimesByMovie(Long movieId, Long cinemaId) {
        if (cinemaId == null) {
            return showtimeRepository.findByMovie_Id(movieId);
        }
        return showtimeRepository.findByMovie_IdAndRoom_Cinema_Id(movieId, cinemaId);
    }

    public Movie updateMovie(Long id, Movie incoming) {
        Movie m = getMovieById(id);
        m.setTitle(incoming.getTitle());
        m.setDescription(incoming.getDescription());
        m.setDuration(incoming.getDuration());
        m.setGenre(incoming.getGenre());
        m.setReleaseDate(incoming.getReleaseDate());
        m.setPosterUrl(incoming.getPosterUrl());
        m.setTrailerUrl(incoming.getTrailerUrl());
        m.setStatus(incoming.getStatus());
        m.setLanguage(incoming.getLanguage());
        m.setRating(incoming.getRating());
        m.setThumbnailUrl(incoming.getThumbnailUrl());
        m.setCountry(incoming.getCountry());
        m.setCastMembers(incoming.getCastMembers());
        m.setAgeLimit(incoming.getAgeLimit());
        m.setDirector(incoming.getDirector());
        return movieRepository.save(m);
    }

    @Transactional
    public void deleteMovie(Long id) {
        getMovieById(id);
        showtimeRepository.deleteByMovie_Id(id);
        movieRepository.deleteById(id);
    }
}
