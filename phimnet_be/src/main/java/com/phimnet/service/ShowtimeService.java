package com.phimnet.service;

import com.phimnet.dto.ShowtimeWriteRequest;
import com.phimnet.entity.Movie;
import com.phimnet.entity.Room;
import com.phimnet.entity.Showtime;
import com.phimnet.repository.MovieRepository;
import com.phimnet.repository.RoomRepository;
import com.phimnet.repository.ShowtimeRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final RoomRepository roomRepository;

    public Showtime createFromRequest(ShowtimeWriteRequest req) {
        Movie movie = movieRepository.findById(req.getMovieId()).orElseThrow(() -> new RuntimeException("Không tìm thấy phim"));
        Room room = roomRepository.findById(req.getRoomId()).orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
        Showtime s = new Showtime();
        s.setMovie(movie);
        s.setRoom(room);
        s.setStartTime(req.getStartTime());
        s.setEndTime(req.getEndTime());
        s.setPrice(req.getPrice());
        return showtimeRepository.save(s);
    }

    public List<Showtime> getAllShowtimes() {
        return showtimeRepository.findAll(Sort.by(Sort.Direction.DESC, "startTime"));
    }

    public Showtime getShowtimeById(Long id) {
        return showtimeRepository.findById(id).orElseThrow(() -> new RuntimeException("Showtime not found"));
    }

    public Showtime updateFromRequest(Long id, ShowtimeWriteRequest req) {
        Showtime s = getShowtimeById(id);
        Movie movie = movieRepository.findById(req.getMovieId()).orElseThrow(() -> new RuntimeException("Không tìm thấy phim"));
        Room room = roomRepository.findById(req.getRoomId()).orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
        s.setMovie(movie);
        s.setRoom(room);
        s.setStartTime(req.getStartTime());
        s.setEndTime(req.getEndTime());
        s.setPrice(req.getPrice());
        return showtimeRepository.save(s);
    }

    @Transactional
    public void deleteShowtime(Long id) {
        if (!showtimeRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy lịch chiếu");
        }
        showtimeRepository.deleteById(id);
    }
}
