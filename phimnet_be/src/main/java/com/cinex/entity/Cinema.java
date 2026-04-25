package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "cinemas")
public class Cinema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String location;
}
