package com.cinex.repository;

import com.cinex.entity.Promotion;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    List<Promotion> findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LocalDateTime startDate,
            LocalDateTime endDate);

    List<Promotion> findByActiveTrueAndStartDateIsNullAndEndDateGreaterThanEqual(LocalDateTime endDate);

    List<Promotion> findByActiveTrueAndStartDateLessThanEqualAndEndDateIsNull(LocalDateTime startDate);

    List<Promotion> findByActiveTrueAndStartDateIsNullAndEndDateIsNull();

    Optional<Promotion> findByCodeIgnoreCaseAndActiveTrue(String code);
}
