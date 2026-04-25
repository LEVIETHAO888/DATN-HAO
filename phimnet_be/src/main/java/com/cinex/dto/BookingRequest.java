package com.cinex.dto;

import lombok.Data;
import java.util.List;

@Data
public class BookingRequest {
    private Long showtimeId;
    private List<Long> seatIds;
    private List<ComboRequest> combos;

    @Data
    public static class ComboRequest {
        private Long comboId;
        private Integer quantity;
    }
}
