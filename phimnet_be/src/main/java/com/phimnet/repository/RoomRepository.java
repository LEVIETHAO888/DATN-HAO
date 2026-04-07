package com.phimnet.repository;

import com.phimnet.entity.Room;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findAllByOrderByCinema_IdAscNameAsc();
}
