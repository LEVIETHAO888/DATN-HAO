package com.cinex.dto;

import lombok.Data;

@Data
public class SeatStatusDto {
    private Long id;
    private String seatNumber;
    private String type;
    private boolean isBooked;

    public SeatStatusDto(Long id, String seatNumber, String type, boolean isBooked) {
        this.id = id;
        this.seatNumber = seatNumber;
        this.type = type;
        this.isBooked = isBooked;
    }
}
