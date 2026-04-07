package com.phimnet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phimnet.entity.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Role findByName(String name);
}