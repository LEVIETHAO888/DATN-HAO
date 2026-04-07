package com.phimnet.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.phimnet.entity.*;
import com.phimnet.service.*;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public Post create(@RequestBody Post p, @AuthenticationPrincipal User user) {
        p.setUser(user);
        return postService.createPost(p);
    }

    @GetMapping
    public List<Post> getAll() {
        return postService.getApprovedPosts();
    }

    @GetMapping("/my")
    public List<Post> getMyPosts(@AuthenticationPrincipal User user) {
        return postService.getPostsByUser(user.getId());
    }

    @PutMapping("/{id}/approve")
    public Post approve(@PathVariable Long id) {
        return postService.approvePost(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        postService.deletePost(id);
    }
}