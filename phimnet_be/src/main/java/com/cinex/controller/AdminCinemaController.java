package com.cinex.controller;

import com.cinex.entity.Cinema;
import com.cinex.repository.CinemaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/cinemas")
@RequiredArgsConstructor
public class AdminCinemaController {

    private final CinemaRepository cinemaRepository;

    @PostMapping
    public Cinema create(@RequestBody Cinema cinema) {
        Cinema entity = new Cinema();
        entity.setName(cinema.getName());
        entity.setLocation(cinema.getLocation());
        return cinemaRepository.save(entity);
    }

    @PutMapping("/{id}")
    public Cinema update(@PathVariable Long id, @RequestBody Cinema cinema) {
        Cinema entity = cinemaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy rạp chiếu"));
        entity.setName(cinema.getName());
        entity.setLocation(cinema.getLocation());
        return cinemaRepository.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        Cinema entity = cinemaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy rạp chiếu"));
        cinemaRepository.delete(entity);
    }
}
