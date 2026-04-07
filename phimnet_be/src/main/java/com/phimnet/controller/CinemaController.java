package com.phimnet.controller;

import com.phimnet.entity.Cinema;
import com.phimnet.repository.CinemaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaRepository cinemaRepository;

    @GetMapping
    public List<Cinema> listCinemas() {
        return cinemaRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }
}
