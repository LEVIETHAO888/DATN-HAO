package com.phimnet.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.phimnet.entity.*;
import com.phimnet.repository.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

    public Comment addComment(Comment comment) {
        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsByPost(Long postId) {
        return commentRepository.findByPostId(postId);
    }

    public void deleteComment(Long commentId) {
        commentRepository.deleteById(commentId);
    }
}