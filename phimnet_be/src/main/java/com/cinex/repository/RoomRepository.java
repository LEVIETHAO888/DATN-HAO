package com.cinex.repository;

import com.cinex.entity.Room;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findAllByOrderByCinema_IdAscNameAsc();
}
