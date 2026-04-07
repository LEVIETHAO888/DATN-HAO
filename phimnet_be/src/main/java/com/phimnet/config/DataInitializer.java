package com.phimnet.config;

import com.phimnet.entity.Cinema;
import com.phimnet.entity.Role;
import com.phimnet.entity.Room;
import com.phimnet.entity.User;
import com.phimnet.repository.CinemaRepository;
import com.phimnet.repository.RoleRepository;
import com.phimnet.repository.RoomRepository;
import com.phimnet.repository.UserRepository;

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
    }
}