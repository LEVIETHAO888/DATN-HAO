package com.phimnet.controller;

import com.phimnet.entity.Room;
import com.phimnet.repository.RoomRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepository;

    @GetMapping
    public List<Room> listRooms() {
        return roomRepository.findAllByOrderByCinema_IdAscNameAsc();
    }
}
