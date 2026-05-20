package com.busmanagement.controller;

import com.busmanagement.dto.request.CreateStaffRequest;
import com.busmanagement.entity.BusCompany;
import com.busmanagement.entity.Driver;
import com.busmanagement.entity.Role;
import com.busmanagement.entity.User;
import com.busmanagement.entity.Vehicle;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.DriverRepository;
import com.busmanagement.repository.ReviewRepository;
import com.busmanagement.repository.RoleRepository;
import com.busmanagement.repository.RouteRepository;
import com.busmanagement.repository.TicketRepository;
import com.busmanagement.repository.UserRepository;
import com.busmanagement.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.busmanagement.service.BusCompanyService;
import com.busmanagement.service.DriverService;
import com.busmanagement.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final BusCompanyService busCompanyService;
    private final VehicleService vehicleService;
    private final DriverService driverService;
    private final RouteRepository routeRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TicketRepository ticketRepository;
    private final ReviewRepository reviewRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<BusCompany> all = busCompanyService.getAll();
        long pending   = all.stream().filter(c -> "PENDING".equals(c.getStatus())).count();
        long approved  = all.stream().filter(c -> "APPROVED".equals(c.getStatus())).count();
        long rejected  = all.stream().filter(c -> "REJECTED".equals(c.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCompanies", all.size());
        stats.put("pendingCompanies", pending);
        stats.put("approvedCompanies", approved);
        stats.put("rejectedCompanies", rejected);
        stats.put("totalRoutes", routeRepository.count());
        stats.put("totalVehicles", vehicleRepository.count());
        stats.put("totalDrivers", driverRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("recentPending", all.stream().filter(c -> "PENDING".equals(c.getStatus())).limit(5).toList());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/bus-companies")
    public ResponseEntity<List<BusCompany>> getAll(@RequestParam(required = false) String status) {
        if (status != null) return ResponseEntity.ok(busCompanyService.getByStatus(status));
        return ResponseEntity.ok(busCompanyService.getAll());
    }

    @GetMapping("/bus-companies/{id}")
    public ResponseEntity<BusCompany> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(busCompanyService.getById(id));
    }

    @PutMapping("/bus-companies/{id}/approve")
    public ResponseEntity<BusCompany> approve(@PathVariable Long id,
                                              @AuthenticationPrincipal Long adminId) {
        return ResponseEntity.ok(busCompanyService.approve(id, adminId));
    }

    @PutMapping("/bus-companies/{id}/reject")
    public ResponseEntity<BusCompany> reject(@PathVariable Long id) {
        return ResponseEntity.ok(busCompanyService.reject(id));
    }

    @DeleteMapping("/bus-companies/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        busCompanyService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bus-companies/{id}/overview")
    public ResponseEntity<Map<String, Object>> overview(@PathVariable Long id) {
        BusCompany company = busCompanyService.getById(id);
        List<Vehicle> vehicles = vehicleService.getByCompanyId(id);
        List<Driver> drivers = driverService.getByCompanyId(id);

        Map<String, Object> data = new HashMap<>();
        data.put("company", company);
        data.put("vehicles", vehicles);
        data.put("drivers", drivers);
        return ResponseEntity.ok(data);
    }

    // ===== All vehicles / drivers / users =====
    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverRepository.findAll());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // ===== Staff management =====
    @GetMapping("/staff")
    public ResponseEntity<List<User>> getStaff() {
        Role staffRole = roleRepository.findByName("STAFF")
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role không tồn tại"));
        return ResponseEntity.ok(userRepository.findByRoleId(staffRole.getId()));
    }

    @PostMapping("/staff")
    public ResponseEntity<User> createStaff(@RequestBody CreateStaffRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new ApiException(HttpStatus.CONFLICT, "Username đã tồn tại");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new ApiException(HttpStatus.CONFLICT, "Email đã tồn tại");
        Role staffRole = roleRepository.findByName("STAFF")
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role không tồn tại"));
        User staff = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(staffRole)
                .authProvider("LOCAL")
                .status("ACTIVE")
                .build();
        return ResponseEntity.ok(userRepository.save(staff));
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
        if (!"STAFF".equals(user.getRole().getName()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản này không phải Staff");
        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/customers")
    public ResponseEntity<List<User>> getCustomers() {
        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role không tồn tại"));
        return ResponseEntity.ok(userRepository.findByRoleId(customerRole.getId()));
    }

    @DeleteMapping("/customers/{id}")
    @Transactional
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        if (!"CUSTOMER".equals(user.getRole().getName()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản này không phải Customer");
        reviewRepository.deleteByCustomerId(id);
        ticketRepository.deleteByCustomerId(id);
        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/owners/{id}")
    @Transactional
    public ResponseEntity<Void> deleteOwner(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        if (!"OWNER".equals(user.getRole().getName()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản này không phải Owner");
        busCompanyService.getAll().stream()
                .filter(c -> c.getOwner().getId().equals(id))
                .findFirst()
                .ifPresent(c -> busCompanyService.delete(c.getId()));
        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }
}
