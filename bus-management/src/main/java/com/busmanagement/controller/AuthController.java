package com.busmanagement.controller;

import com.busmanagement.dto.request.ChangePasswordRequest;
import com.busmanagement.dto.request.CustomerRegisterRequest;
import com.busmanagement.dto.request.LoginRequest;
import com.busmanagement.dto.request.RegisterRequest;
import com.busmanagement.dto.request.UpdateProfileRequest;
import com.busmanagement.dto.response.AuthResponse;
import com.busmanagement.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.registerOwner(req));
    }

    @PostMapping("/register/customer")
    public ResponseEntity<AuthResponse> registerCustomer(@Valid @RequestBody CustomerRegisterRequest req) {
        return ResponseEntity.ok(authService.registerCustomer(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/profile")
    public ResponseEntity<AuthResponse> getProfile(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(authService.getProfile(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(@RequestBody UpdateProfileRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(authService.updateProfile(userId, req));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req,
            @AuthenticationPrincipal Long userId) {
        authService.changePassword(userId, req);
        return ResponseEntity.ok().build();
    }
}
