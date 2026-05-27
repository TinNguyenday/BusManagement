package com.busmanagement.service;

import com.busmanagement.dto.request.CreateStaffRequest;
import com.busmanagement.entity.RoleName;
import com.busmanagement.entity.Role;
import com.busmanagement.entity.Status;
import com.busmanagement.entity.User;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.ReviewRepository;
import com.busmanagement.repository.RoleRepository;
import com.busmanagement.repository.TicketRepository;
import com.busmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final BusCompanyService busCompanyService;
    private final ReviewRepository reviewRepository;
    private final TicketRepository ticketRepository;

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public List<User> getByRole(String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role không tồn tại"));
        return userRepository.findByRoleId(role.getId());
    }

    public User createStaff(CreateStaffRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new ApiException(HttpStatus.CONFLICT, "Username đã tồn tại");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new ApiException(HttpStatus.CONFLICT, "Email đã tồn tại");

        Role staffRole = roleRepository.findByName(RoleName.STAFF)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role không tồn tại"));

        User staff = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(staffRole)
                .authProvider(Status.LOCAL)
                .status(Status.ACTIVE)
                .build();

        return userRepository.save(staff);
    }

    @Transactional
    public void deleteStaff(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
        if (!RoleName.STAFF.equals(user.getRole().getName()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản này không phải Staff");
        userRepository.delete(user);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        if (!RoleName.CUSTOMER.equals(user.getRole().getName()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản này không phải Customer");
        reviewRepository.deleteByCustomerId(id);
        ticketRepository.deleteByCustomerId(id);
        userRepository.delete(user);
    }

    @Transactional
    public void deleteOwner(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        if (!RoleName.OWNER.equals(user.getRole().getName()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản này không phải Owner");
        // If company exists, delete() cascades to owner; otherwise delete user directly.
        busCompanyService.findByOwnerId(id)
                .ifPresentOrElse(
                        c -> busCompanyService.delete(c.getId()),
                        () -> userRepository.delete(user));
    }
}
