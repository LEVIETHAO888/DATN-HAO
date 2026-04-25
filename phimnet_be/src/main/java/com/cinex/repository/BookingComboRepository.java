package com.cinex.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.cinex.entity.BookingCombo;

@Repository
public interface BookingComboRepository extends JpaRepository<BookingCombo, Long> {
}
