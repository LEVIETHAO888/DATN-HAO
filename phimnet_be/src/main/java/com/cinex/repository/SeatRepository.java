package com.cinex.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cinex.entity.Seat;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByRoomId(Long roomId);
}
