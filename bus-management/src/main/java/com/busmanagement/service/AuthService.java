package com.busmanagement.service;

import com.busmanagement.dto.request.ChangePasswordRequest;
import com.busmanagement.dto.request.CustomerRegisterRequest;
import com.busmanagement.dto.request.LoginRequest;
import com.busmanagement.dto.request.RegisterRequest;
import com.busmanagement.dto.request.UpdateProfileRequest;
import com.busmanagement.dto.response.AuthResponse;
import com.busmanagement.entity.BusCompany;
import com.busmanagement.entity.RoleName;
import com.busmanagement.entity.Role;
import com.busmanagement.entity.Status;
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
        validateUniqueCredentials(req.getUsername(), req.getEmail());

        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Role CUSTOMER không tồn tại"));

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(customerRole)
                .authProvider(Status.LOCAL)
                .status(Status.ACTIVE)
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getId(), user.getUsername(), customerRole.getName());

        return buildAuthResponse(user, customerRole.getName(), token);
    }

    @Transactional
    public AuthResponse registerOwner(RegisterRequest req) {
        validateUniqueCredentials(req.getUsername(), req.getEmail());

        Role ownerRole = roleRepository.findByName(RoleName.OWNER)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Role OWNER không tồn tại"));

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(ownerRole)
                .authProvider(Status.LOCAL)
                .status(Status.PENDING)
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
                .status(Status.PENDING)
                .build();
        busCompanyRepository.save(company);

        return buildAuthResponse(user, ownerRole.getName(), null);
    }

    public AuthResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        return buildAuthResponse(user, user.getRole().getName(), null);
    }

    public AuthResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        if (req.getFullName() != null && !req.getFullName().isBlank())
            user.setFullName(req.getFullName());
        if (req.getPhone() != null)
            user.setPhone(req.getPhone());
        userRepository.save(user);
        return buildAuthResponse(user, user.getRole().getName(), null);
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

        if (Status.PENDING.equals(user.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đang chờ admin duyệt");
        if (Status.REJECTED.equals(user.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị từ chối");
        if (!Status.ACTIVE.equals(user.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản không khả dụng");

        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().getName());
        return buildAuthResponse(user, user.getRole().getName(), token);
    }

    private void validateUniqueCredentials(String username, String email) {
        if (userRepository.existsByUsername(username))
            throw new ApiException(HttpStatus.CONFLICT, "Username đã tồn tại");
        if (userRepository.existsByEmail(email))
            throw new ApiException(HttpStatus.CONFLICT, "Email đã tồn tại");
    }

    private AuthResponse buildAuthResponse(User user, String role, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(role)
                .status(user.getStatus())
                .build();
    }
}
