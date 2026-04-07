package com.phimnet.dto;

import lombok.Data;
import java.util.List;

@Data
public class BookingRequest {
    private Long showtimeId;
    private List<Long> seatIds;
}