package com.phimnet.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class ShowtimeWriteRequest {
    private Long movieId;
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal price;
}
