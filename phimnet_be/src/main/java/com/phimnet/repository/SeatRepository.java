package com.phimnet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phimnet.entity.Seat;

public interface SeatRepository extends JpaRepository<Seat, Long> {
}