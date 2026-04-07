package com.phimnet.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.phimnet.entity.*;
import com.phimnet.service.*;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/post/{postId}")
    public Like likePost(@PathVariable Long postId, @AuthenticationPrincipal User user) {
        return likeService.likePost(user, postId);
    }

    @DeleteMapping("/post/{postId}")
    public void unlikePost(@PathVariable Long postId, @AuthenticationPrincipal User user) {
        likeService.unlikePost(user, postId);
    }

    @GetMapping("/post/{postId}/count")
    public long getLikeCount(@PathVariable Long postId) {
        return likeService.getLikeCount(postId);
    }
}