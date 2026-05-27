package com.busmanagement.service;

import com.busmanagement.dto.request.RouteRequest;
import com.busmanagement.entity.Route;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.RouteRepository;
import com.busmanagement.repository.VehicleRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final VehicleRouteRepository vehicleRouteRepository;

    public List<Route> getAll() {
        return routeRepository.findAll();
    }

    public Route getById(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tuyến"));
    }

    public Route create(RouteRequest req, Long staffId) {
        if (routeRepository.existsByOriginAndDestination(req.getOrigin(), req.getDestination()))
            throw new ApiException(HttpStatus.CONFLICT, "Tuyến đường này đã tồn tại");

        Route route = Route.builder()
                .name(req.getName())
                .origin(req.getOrigin())
                .destination(req.getDestination())
                .distanceKm(req.getDistanceKm())
                .estimatedDurationMin(req.getEstimatedDurationMin())
                .basePrice(req.getBasePrice())
                .createdBy(staffId)
                .build();

        return routeRepository.save(route);
    }

    public Route update(Long id, RouteRequest req) {
        Route route = getById(id);
        route.setName(req.getName());
        route.setOrigin(req.getOrigin());
        route.setDestination(req.getDestination());
        route.setDistanceKm(req.getDistanceKm());
        route.setEstimatedDurationMin(req.getEstimatedDurationMin());
        route.setBasePrice(req.getBasePrice());
        return routeRepository.save(route);
    }

    public void delete(Long id) {
        Route r = getById(id);
        if (vehicleRouteRepository.existsByRouteId(id))
            throw new ApiException(HttpStatus.CONFLICT, "Tuyến đang có chuyến xe, không thể xóa");
        routeRepository.delete(r);
    }
}
