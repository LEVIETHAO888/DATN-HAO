package com.cinex.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cinex.entity.User;
import com.cinex.repository.UserRepository;

import java.io.IOException;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                String email = jwtUtil.extractEmail(token);

                User user = userRepository.findByEmail(email).orElse(null);

                if (user != null && user.isEnabled()) {
                    String rawRoleName = user.getRole() != null ? user.getRole().getName() : "USER";
                    String normalizedRole = rawRoleName == null ? "USER" : rawRoleName.trim().toUpperCase();
                    if (normalizedRole.startsWith("ROLE_")) {
                        normalizedRole = normalizedRole.substring(5);
                    }
                    if (normalizedRole.isBlank()) {
                        normalizedRole = "USER";
                    }

                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole));
                    SecurityContextHolder.getContext().setAuthentication(
                            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                    user, null, authorities));
                }
            } catch (Exception e) {
                // token lỗi thì bỏ qua
            }
        }

        chain.doFilter(request, response);
    }
}
