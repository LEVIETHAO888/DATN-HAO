package com.cinex.controller;

import com.cinex.entity.Cinema;
import com.cinex.entity.Room;
import com.cinex.repository.CinemaRepository;
import com.cinex.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/rooms")
@RequiredArgsConstructor
public class AdminRoomController {

    private final RoomRepository roomRepository;
    private final CinemaRepository cinemaRepository;

    @PostMapping
    public Room create(@RequestBody RoomCreateRequest req) {
        if (req == null || req.cinemaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin rạp chiếu");
        }

        Cinema cinema = cinemaRepository.findById(req.cinemaId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy rạp chiếu"));

        Room room = new Room();
        room.setCinema(cinema);
        room.setName(req.name() != null ? req.name().trim() : null);
        room.setTotalSeats(req.totalSeats());
        return roomRepository.save(room);
    }

    public record RoomCreateRequest(Long cinemaId, String name, Integer totalSeats) {}
}
