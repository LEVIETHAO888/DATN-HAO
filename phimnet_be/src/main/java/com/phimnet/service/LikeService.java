package com.phimnet.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.phimnet.entity.*;
import com.phimnet.repository.*;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;

    public Like likePost(User user, Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        Optional<Like> existing = likeRepository.findByUserIdAndPostId(user.getId(), postId);
        if (existing.isPresent()) {
            throw new RuntimeException("Already liked");
        }
        Like like = new Like();
        like.setUser(user);
        like.setPost(post);
        return likeRepository.save(like);
    }

    public void unlikePost(User user, Long postId) {
        Optional<Like> existing = likeRepository.findByUserIdAndPostId(user.getId(), postId);
        existing.ifPresent(likeRepository::delete);
    }

    public long getLikeCount(Long postId) {
        return likeRepository.findByPostId(postId).size();
    }
}