package com.cinex.config;

import com.cinex.entity.Cinema;
import com.cinex.entity.Promotion;
import com.cinex.entity.Role;
import com.cinex.entity.Room;
import com.cinex.entity.User;
import com.cinex.repository.CinemaRepository;
import com.cinex.repository.PromotionRepository;
import com.cinex.repository.RoleRepository;
import com.cinex.repository.RoomRepository;
import com.cinex.repository.UserRepository;

import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final CinemaRepository cinemaRepository;
    private final RoomRepository roomRepository;
    private final PromotionRepository promotionRepository;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {

        // tạo role nếu chưa có
        if (roleRepo.count() == 0) {
            roleRepo.save(new Role(null, "ADMIN"));
            roleRepo.save(new Role(null, "MANAGER"));
            roleRepo.save(new Role(null, "USER"));
        }

        // tạo admin nếu chưa có
        if (userRepo.count() == 0) {
            User admin = new User();
            admin.setEmail("admin@gmail.com");
            admin.setUsername("admin");
            admin.setPassword(encoder.encode("123456"));
            admin.setRole(roleRepo.findByName("ADMIN"));

            userRepo.save(admin);
        }

        if (cinemaRepository.count() == 0) {
            Cinema c = new Cinema();
            c.setName("PhimNet Cinema");
            c.setLocation("Hà Nội");
            cinemaRepository.save(c);
        }

        if (roomRepository.count() == 0) {
            cinemaRepository
                    .findAll()
                    .stream()
                    .findFirst()
                    .ifPresent(
                            c -> {
                                Room r = new Room();
                                r.setCinema(c);
                                r.setName("Phòng 1");
                                r.setTotalSeats(100);
                                roomRepository.save(r);
                            });
        }

        // Ensure existing promotions are visible on user page.
        // Some seeded rows may accidentally be saved with active=false.
        LocalDateTime now = LocalDateTime.now();
        promotionRepository
                .findAll()
                .forEach(
                        promotion -> {
                            boolean withinTimeRange =
                                    (promotion.getStartDate() == null || !promotion.getStartDate().isAfter(now))
                                            && (promotion.getEndDate() == null || !promotion.getEndDate().isBefore(now));
                            if (withinTimeRange && !promotion.isActive()) {
                                promotion.setActive(true);
                                promotionRepository.save(promotion);
                            }
                        });
    }
}
