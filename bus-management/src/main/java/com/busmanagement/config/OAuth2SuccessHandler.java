package com.busmanagement.config;

import com.busmanagement.entity.RoleName;
import com.busmanagement.entity.Role;
import com.busmanagement.entity.Status;
import com.busmanagement.entity.User;
import com.busmanagement.repository.RoleRepository;
import com.busmanagement.repository.UserRepository;
import com.busmanagement.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;

    @Value("${app.oauth2.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                    .orElseThrow(() -> new RuntimeException("Role CUSTOMER not found"));

            String baseUsername = email.split("@")[0];
            String username = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + counter++;
            }

            return userRepository.save(User.builder()
                    .email(email)
                    .username(username)
                    .fullName(name)
                    .avatarUrl(picture)
                    .role(customerRole)
                    .authProvider(Status.GOOGLE)
                    .status(Status.ACTIVE)
                    .build());
        });

        String token = Status.ACTIVE.equals(user.getStatus())
                ? jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().getName())
                : null;

        String redirectUrl = frontendUrl + "/oauth2/callback"
                + "?token=" + (token != null ? URLEncoder.encode(token, StandardCharsets.UTF_8) : "")
                + "&userId=" + user.getId()
                + "&username=" + URLEncoder.encode(user.getUsername(), StandardCharsets.UTF_8)
                + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                + "&fullName=" + URLEncoder.encode(name != null ? name : "", StandardCharsets.UTF_8)
                + "&role=" + user.getRole().getName()
                + "&status=" + user.getStatus();

        response.sendRedirect(redirectUrl);
    }
}
