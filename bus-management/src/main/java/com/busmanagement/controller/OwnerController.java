package com.busmanagement.controller;

import com.busmanagement.dto.request.AssignmentRequest;
import com.busmanagement.dto.request.DriverRequest;
import com.busmanagement.dto.request.VehicleRequest;
import com.busmanagement.entity.BusCompany;
import com.busmanagement.entity.Driver;
import com.busmanagement.entity.Status;
import com.busmanagement.entity.Vehicle;
import com.busmanagement.entity.VehicleRoute;
import com.busmanagement.service.BusCompanyService;
import com.busmanagement.service.DriverService;
import com.busmanagement.service.VehicleRouteService;
import com.busmanagement.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerController {

    private final VehicleService vehicleService;
    private final DriverService driverService;
    private final VehicleRouteService vehicleRouteService;
    private final BusCompanyService busCompanyService;

    // ===== Company info =====

    @GetMapping("/my-company")
    public ResponseEntity<BusCompany> myCompany(@AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(busCompanyService.getByOwnerId(ownerId));
    }

    @PutMapping("/my-company")
    public ResponseEntity<BusCompany> updateCompany(@RequestBody Map<String, String> body,
                                                    @AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(busCompanyService.updateInfo(ownerId,
                body.get("phone"), body.get("address"), body.get("bankName"), body.get("bankAccountNumber")));
    }

    // ===== Vehicles =====

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getVehicles(@AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(vehicleService.getByOwner(ownerId));
    }

    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> createVehicle(@Valid @RequestBody VehicleRequest req,
                                                 @AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(vehicleService.create(req, ownerId));
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id,
                                                 @Valid @RequestBody VehicleRequest req,
                                                 @AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(vehicleService.update(id, req, ownerId));
    }

    @PatchMapping("/vehicles/{id}/type")
    public ResponseEntity<Vehicle> updateVehicleType(@PathVariable Long id,
                                                     @RequestBody Map<String, String> body,
                                                     @AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(vehicleService.updateType(id, body.get("vehicleType"), ownerId));
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id,
                                              @AuthenticationPrincipal Long ownerId) {
        vehicleService.delete(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    // ===== Drivers =====

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getDrivers(@AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(driverService.getByOwner(ownerId));
    }

    @PostMapping("/drivers")
    public ResponseEntity<Driver> createDriver(@Valid @RequestBody DriverRequest req,
                                               @AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(driverService.create(req, ownerId));
    }

    @PutMapping("/drivers/{id}")
    public ResponseEntity<Driver> updateDriver(@PathVariable Long id,
                                               @Valid @RequestBody DriverRequest req,
                                               @AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(driverService.update(id, req, ownerId));
    }

    @DeleteMapping("/drivers/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id,
                                             @AuthenticationPrincipal Long ownerId) {
        driverService.delete(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    // ===== Assignments =====

    @GetMapping("/assignments")
    public ResponseEntity<List<VehicleRoute>> getAssignments(@AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(vehicleRouteService.getByOwner(ownerId));
    }

    @PostMapping("/assignments")
    public ResponseEntity<VehicleRoute> createAssignment(@Valid @RequestBody AssignmentRequest req,
                                                         @AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(vehicleRouteService.create(req, ownerId));
    }

    @PutMapping("/assignments/{id}/status")
    public ResponseEntity<VehicleRoute> updateAssignmentStatus(@PathVariable Long id,
                                                               @RequestParam String status,
                                                               @AuthenticationPrincipal Long ownerId) {
        return ResponseEntity.ok(vehicleRouteService.updateStatus(id, status, ownerId));
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id,
                                                 @AuthenticationPrincipal Long ownerId) {
        vehicleRouteService.delete(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal Long ownerId) {
        List<Vehicle> vehicles = vehicleService.getByOwner(ownerId);
        List<Driver> drivers = driverService.getByOwner(ownerId);
        List<VehicleRoute> assignments = vehicleRouteService.getByOwner(ownerId);

        long scheduled = 0, completed = 0, cancelled = 0;
        for (VehicleRoute a : assignments) {
            switch (a.getStatus()) {
                case Status.SCHEDULED -> scheduled++;
                case Status.COMPLETED -> completed++;
                case Status.CANCELLED -> cancelled++;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVehicles", vehicles.size());
        stats.put("totalDrivers", drivers.size());
        stats.put("totalAssignments", assignments.size());
        stats.put("scheduled", scheduled);
        stats.put("completed", completed);
        stats.put("cancelled", cancelled);
        stats.put("recentAssignments", assignments.stream()
                .sorted(Comparator.comparing(VehicleRoute::getDepartureTime).reversed())
                .limit(5).toList());
        return ResponseEntity.ok(stats);
    }
}
