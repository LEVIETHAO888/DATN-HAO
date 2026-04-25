package com.cinex.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.cinex.entity.*;
import com.cinex.service.*;
import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping
    public List<Showtime> getAllShowtimes() {
        return showtimeService.getAllShowtimes();
    }

    @GetMapping("/{id}")
    public Showtime getShowtime(@PathVariable Long id) {
        return showtimeService.getShowtimeById(id);
    }

    @GetMapping("/{id}/seats")
    public List<com.cinex.dto.SeatStatusDto> getSeatStatuses(@PathVariable Long id) {
        return showtimeService.getSeatStatusForShowtime(id);
    }
}
