package com.phimnet.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.phimnet.entity.*;
import com.phimnet.repository.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    public Post createPost(Post post) {
        post.setStatus("pending");
        return postRepository.save(post);
    }

    public List<Post> getApprovedPosts() {
        return postRepository.findByStatus("approved");
    }

    public List<Post> getPostsByUser(Long userId) {
        return postRepository.findByUserId(userId);
    }

    public Post approvePost(Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        post.setStatus("approved");
        return postRepository.save(post);
    }

    public void deletePost(Long postId) {
        postRepository.deleteById(postId);
    }
}