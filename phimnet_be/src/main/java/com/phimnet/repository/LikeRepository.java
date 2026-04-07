package com.phimnet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phimnet.entity.Like;
import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUserIdAndPostId(Long userId, Long postId);
    List<Like> findByPostId(Long postId);
}
