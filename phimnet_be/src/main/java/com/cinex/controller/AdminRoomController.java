package com.cinex.controller;

import com.cinex.entity.Cinema;
import com.cinex.entity.Room;
import com.cinex.entity.Seat;
import com.cinex.repository.CinemaRepository;
import com.cinex.repository.RoomRepository;
import com.cinex.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/rooms")
@RequiredArgsConstructor
public class AdminRoomController {

    private final RoomRepository roomRepository;
    private final CinemaRepository cinemaRepository;
    private final SeatRepository seatRepository;

    @PostMapping
    public Room create(@RequestBody RoomCreateRequest req) {
        if (req == null || req.cinemaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin rạp chiếu");
        }

        Cinema cinema = cinemaRepository.findById(req.cinemaId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy rạp chiếu"));

        int totalSeats = req.totalSeats() != null && req.totalSeats() > 0 ? req.totalSeats() : 0;

        Room room = new Room();
        room.setCinema(cinema);
        room.setName(req.name() != null ? req.name().trim() : null);
        room.setTotalSeats(totalSeats);
        room = roomRepository.save(room);

        // ── Tự động tạo các bản ghi Seat theo layout hàng-cột ─────────────
        // Mỗi hàng 10 ghế: A1-A10, B1-B10, ...
        // Hàng cuối (VIP) được đánh dấu type = "VIP", còn lại type = "STANDARD"
        if (totalSeats > 0) {
            int seatsPerRow = 10;
            int rows = (int) Math.ceil((double) totalSeats / seatsPerRow);
            List<Seat> seats = new ArrayList<>();
            int seatCount = 0;

            for (int r = 0; r < rows && seatCount < totalSeats; r++) {
                char rowChar = (char) ('A' + r);
                // Hàng cuối là VIP
                String type = (r == rows - 1) ? "VIP" : "STANDARD";

                for (int col = 1; col <= seatsPerRow && seatCount < totalSeats; col++) {
                    Seat seat = new Seat();
                    seat.setRoom(room);
                    seat.setSeatNumber(rowChar + String.valueOf(col));
                    seat.setType(type);
                    seats.add(seat);
                    seatCount++;
                }
            }

            seatRepository.saveAll(seats);
        }

        return room;
    }

    public record RoomCreateRequest(Long cinemaId, String name, Integer totalSeats) {}
}
