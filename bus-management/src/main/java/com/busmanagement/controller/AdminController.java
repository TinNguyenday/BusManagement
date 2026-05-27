package com.busmanagement.controller;

import com.busmanagement.dto.request.CreateStaffRequest;
import com.busmanagement.entity.BusCompany;
import com.busmanagement.entity.Driver;
import com.busmanagement.entity.RoleName;
import com.busmanagement.entity.Status;
import com.busmanagement.entity.User;
import com.busmanagement.entity.Vehicle;
import com.busmanagement.repository.DriverRepository;
import com.busmanagement.repository.RouteRepository;
import com.busmanagement.repository.UserRepository;
import com.busmanagement.repository.VehicleRepository;
import com.busmanagement.service.BusCompanyService;
import com.busmanagement.service.DriverService;
import com.busmanagement.service.UserService;
import com.busmanagement.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    private final UserService userService;
    private final RouteRepository routeRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<BusCompany> all = busCompanyService.getAll();

        long pending = 0, approved = 0, rejected = 0;
        List<BusCompany> pendingList = new java.util.ArrayList<>();
        for (BusCompany c : all) {
            switch (c.getStatus()) {
                case Status.PENDING  -> { pending++; pendingList.add(c); }
                case Status.APPROVED -> approved++;
                case Status.REJECTED -> rejected++;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCompanies", all.size());
        stats.put("pendingCompanies", pending);
        stats.put("approvedCompanies", approved);
        stats.put("rejectedCompanies", rejected);
        stats.put("totalRoutes", routeRepository.count());
        stats.put("totalVehicles", vehicleRepository.count());
        stats.put("totalDrivers", driverRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("recentPending", pendingList.size() > 5 ? pendingList.subList(0, 5) : pendingList);
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

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAll());
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAll());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAll());
    }

    // ===== Staff management =====

    @GetMapping("/staff")
    public ResponseEntity<List<User>> getStaff() {
        return ResponseEntity.ok(userService.getByRole(RoleName.STAFF));
    }

    @PostMapping("/staff")
    public ResponseEntity<User> createStaff(@RequestBody CreateStaffRequest req) {
        return ResponseEntity.ok(userService.createStaff(req));
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        userService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/customers")
    public ResponseEntity<List<User>> getCustomers() {
        return ResponseEntity.ok(userService.getByRole(RoleName.CUSTOMER));
    }

    @DeleteMapping("/customers/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        userService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/owners/{id}")
    public ResponseEntity<Void> deleteOwner(@PathVariable Long id) {
        userService.deleteOwner(id);
        return ResponseEntity.noContent().build();
    }
}
