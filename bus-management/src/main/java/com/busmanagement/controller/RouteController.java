package com.busmanagement.controller;

import com.busmanagement.dto.request.RouteRequest;
import com.busmanagement.entity.Route;
import com.busmanagement.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    // tất cả role authenticated đều xem được danh sách tuyến
    @GetMapping
    public ResponseEntity<List<Route>> getAll() {
        return ResponseEntity.ok(routeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Route> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(routeService.getById(id));
    }

    // chỉ STAFF mới được CRUD
    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Route> create(@Valid @RequestBody RouteRequest req,
                                        @AuthenticationPrincipal Long staffId) {
        return ResponseEntity.ok(routeService.create(req, staffId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Route> update(@PathVariable Long id,
                                        @Valid @RequestBody RouteRequest req) {
        return ResponseEntity.ok(routeService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        routeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
