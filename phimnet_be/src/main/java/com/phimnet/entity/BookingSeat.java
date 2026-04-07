package com.phimnet.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "booking_seats", uniqueConstraints = @UniqueConstraint(columnNames = {"seat_id","showtime_id"}))
public class BookingSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Booking booking;

    @ManyToOne
    private Seat seat;

    @ManyToOne
    private Showtime showtime;
}
