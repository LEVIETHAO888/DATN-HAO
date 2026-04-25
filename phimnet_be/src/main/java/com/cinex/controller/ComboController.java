package com.cinex.controller;

import com.cinex.entity.Combo;
import com.cinex.repository.ComboRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/combos")
@RequiredArgsConstructor
public class ComboController {

    private final ComboRepository comboRepository;

    @GetMapping
    public List<Combo> getAll() {
        return comboRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Combo> getById(@PathVariable Long id) {
        return comboRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Combo create(@RequestBody Combo combo) {
        return comboRepository.save(combo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Combo> update(@PathVariable Long id, @RequestBody Combo body) {
        return comboRepository.findById(id).map(combo -> {
            combo.setName(body.getName());
            combo.setDescription(body.getDescription());
            combo.setPrice(body.getPrice());
            combo.setImageUrl(body.getImageUrl());
            combo.setAvailable(body.isAvailable());
            return ResponseEntity.ok(comboRepository.save(combo));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!comboRepository.existsById(id)) return ResponseEntity.notFound().build();
        comboRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
