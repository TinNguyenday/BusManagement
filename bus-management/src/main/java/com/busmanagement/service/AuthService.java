package com.busmanagement.service;

import com.busmanagement.dto.request.ChangePasswordRequest;
import com.busmanagement.dto.request.CustomerRegisterRequest;
import com.busmanagement.dto.request.LoginRequest;
import com.busmanagement.dto.request.RegisterRequest;
import com.busmanagement.dto.request.UpdateProfileRequest;
import com.busmanagement.dto.response.AuthResponse;
import com.busmanagement.entity.BusCompany;
import com.busmanagement.entity.Role;
import com.busmanagement.entity.User;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.BusCompanyRepository;
import com.busmanagement.repository.RoleRepository;
import com.busmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BusCompanyRepository busCompanyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse registerCustomer(CustomerRegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new ApiException(HttpStatus.CONFLICT, "Username đã tồn tại");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new ApiException(HttpStatus.CONFLICT, "Email đã tồn tại");

        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Role CUSTOMER không tồn tại"));

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(customerRole)
                .authProvider("LOCAL")
                .status("ACTIVE")
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getId(), user.getUsername(), customerRole.getName());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(customerRole.getName())
                .status(user.getStatus())
                .build();
    }

    @Transactional
    public AuthResponse registerOwner(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new ApiException(HttpStatus.CONFLICT, "Username đã tồn tại");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new ApiException(HttpStatus.CONFLICT, "Email đã tồn tại");

        Role ownerRole = roleRepository.findByName("OWNER")
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Role OWNER không tồn tại"));

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(ownerRole)
                .authProvider("LOCAL")
                .status("PENDING") // chờ admin duyệt
                .build();

        user = userRepository.save(user);

        BusCompany company = BusCompany.builder()
                .owner(user)
                .companyName(req.getCompanyName())
                .address(req.getAddress())
                .phone(req.getPhone())
                .idCardNumber(req.getIdCardNumber())
                .bankAccountNumber(req.getBankAccountNumber())
                .bankName(req.getBankName())
                .status("PENDING")
                .build();
        busCompanyRepository.save(company);

        return AuthResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(ownerRole.getName())
                .status(user.getStatus())
                .token(null) // chưa cho token, phải đợi duyệt
                .build();
    }

    public AuthResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        return AuthResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .build();
    }

    public AuthResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        if (req.getFullName() != null && !req.getFullName().isBlank())
            user.setFullName(req.getFullName());
        if (req.getPhone() != null)
            user.setPhone(req.getPhone());
        userRepository.save(user);
        return AuthResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .build();
    }

    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu");

        if ("PENDING".equals(user.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đang chờ admin duyệt");
        if ("REJECTED".equals(user.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị từ chối");
        if (!"ACTIVE".equals(user.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản không khả dụng");

        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().getName());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .build();
    }
}
