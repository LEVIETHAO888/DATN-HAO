package com.phimnet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phimnet.entity.Comment;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostId(Long postId);
    List<Comment> findByUserId(Long userId);
}