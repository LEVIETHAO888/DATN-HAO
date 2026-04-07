package com.phimnet.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cinema_id")
    private Cinema cinema;

    private String name;

    @Column(name = "total_seats")
    private Integer totalSeats;
}
