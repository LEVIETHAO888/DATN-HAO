package com.cinex.controller;

import com.cinex.dto.ShowtimeWriteRequest;
import com.cinex.entity.Showtime;
import com.cinex.service.ShowtimeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/showtimes")
@RequiredArgsConstructor
public class AdminShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping
    public List<Showtime> list() {
        return showtimeService.getAllShowtimes();
    }

    @PostMapping
    public Showtime create(@RequestBody ShowtimeWriteRequest req) {
        return showtimeService.createFromRequest(req);
    }

    @PutMapping("/{id}")
    public Showtime update(@PathVariable Long id, @RequestBody ShowtimeWriteRequest req) {
        return showtimeService.updateFromRequest(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        showtimeService.deleteShowtime(id);
    }
}
