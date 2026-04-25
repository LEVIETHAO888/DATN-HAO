package com.cinex.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cinex.entity.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Role findByName(String name);
}
