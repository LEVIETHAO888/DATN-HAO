package com.cinex.controller;

import com.cinex.entity.Promotion;
import com.cinex.repository.PromotionRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionRepository promotionRepository;

    @GetMapping
    public List<Promotion> getAll() {
        return promotionRepository.findAll();
    }

    @GetMapping("/active")
    public List<Promotion> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now();

        List<Promotion> active = new ArrayList<>();
        active.addAll(promotionRepository.findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(now, now));
        active.addAll(promotionRepository.findByActiveTrueAndStartDateIsNullAndEndDateGreaterThanEqual(now));
        active.addAll(promotionRepository.findByActiveTrueAndStartDateLessThanEqualAndEndDateIsNull(now));
        active.addAll(promotionRepository.findByActiveTrueAndStartDateIsNullAndEndDateIsNull());

        Map<Long, Promotion> deduplicated = new LinkedHashMap<>();
        for (Promotion promotion : active) {
            if (promotion.getId() != null) {
                deduplicated.putIfAbsent(promotion.getId(), promotion);
            }
        }

        List<Promotion> result = new ArrayList<>(deduplicated.values());
        result.sort(Comparator.comparing(Promotion::getId).reversed());
        return result;
    }

    @PostMapping
    public Promotion create(@RequestBody Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Promotion> update(@PathVariable Long id, @RequestBody Promotion body) {
        return promotionRepository
                .findById(id)
                .map(
                        existing -> {
                            existing.setTitle(body.getTitle());
                            existing.setDescription(body.getDescription());
                            existing.setDiscountPercentage(body.getDiscountPercentage());
                            existing.setCode(body.getCode());
                            existing.setStartDate(body.getStartDate());
                            existing.setEndDate(body.getEndDate());
                            existing.setImageUrl(body.getImageUrl());
                            existing.setActive(body.isActive());
                            return ResponseEntity.ok(promotionRepository.save(existing));
                        })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!promotionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        promotionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
