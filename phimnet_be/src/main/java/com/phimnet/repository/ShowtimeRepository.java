package com.phimnet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phimnet.entity.Showtime;
import java.util.List;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByMovie_Id(Long movieId);

    void deleteByMovie_Id(Long movieId);

    List<Showtime> findByRoom_Cinema_Id(Long cinemaId);

    List<Showtime> findByMovie_IdAndRoom_Cinema_Id(Long movieId, Long cinemaId);
}