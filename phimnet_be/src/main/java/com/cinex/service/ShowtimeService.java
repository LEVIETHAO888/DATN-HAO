package com.cinex.service;

import com.cinex.dto.ShowtimeWriteRequest;
import com.cinex.entity.Movie;
import com.cinex.entity.Room;
import com.cinex.entity.Showtime;
import com.cinex.repository.MovieRepository;
import com.cinex.repository.RoomRepository;
import com.cinex.repository.ShowtimeRepository;
import java.util.List;
import java.util.stream.Collectors;
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
    private final com.cinex.repository.SeatRepository seatRepository;
    private final com.cinex.repository.BookingSeatRepository bookingSeatRepository;

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

    public List<com.cinex.dto.SeatStatusDto> getSeatStatusForShowtime(Long showtimeId) {
        Showtime st = getShowtimeById(showtimeId);
        Long roomId = st.getRoom().getId();

        List<com.cinex.entity.Seat> allSeats = seatRepository.findByRoomId(roomId);
        List<com.cinex.entity.BookingSeat> bookedSeats = bookingSeatRepository.findByShowtimeId(showtimeId);

        java.util.Set<Long> bookedSeatIds = bookedSeats.stream()
                .map(bs -> bs.getSeat().getId())
                .collect(Collectors.toSet());

        return allSeats.stream().map(seat -> new com.cinex.dto.SeatStatusDto(
                seat.getId(),
                seat.getSeatNumber(),
                seat.getType(),
                bookedSeatIds.contains(seat.getId())
        )).collect(Collectors.toList());
    }
}
