package com.busmanagement.service;

import com.busmanagement.dto.request.AssignmentRequest;
import com.busmanagement.entity.*;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleRouteService {

    private final VehicleRouteRepository vehicleRouteRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final RouteRepository routeRepository;
    private final BusCompanyService busCompanyService;
    private final TicketRepository ticketRepository;
    private final ReviewRepository reviewRepository;

    public List<VehicleRoute> getByOwner(Long ownerId) {
        BusCompany company = busCompanyService.getByOwnerId(ownerId);
        return vehicleRouteRepository.findByBusCompanyId(company.getId());
    }

    public VehicleRoute create(AssignmentRequest req, Long ownerId) {
        BusCompany company = busCompanyService.getByOwnerId(ownerId);

        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy xe"));
        if (!vehicle.getBusCompany().getId().equals(company.getId()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Xe không thuộc nhà xe của bạn");

        Driver driver = driverRepository.findById(req.getDriverId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài xế"));
        if (!driver.getBusCompany().getId().equals(company.getId()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài xế không thuộc nhà xe của bạn");

        Route route = routeRepository.findById(req.getRouteId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tuyến"));

        LocalDateTime start = req.getDepartureTime().minusHours(4);
        LocalDateTime end = req.getDepartureTime().plusHours(4);

        if (vehicleRouteRepository.hasVehicleConflict(vehicle.getId(), start, end))
            throw new ApiException(HttpStatus.CONFLICT, "Xe đã có lịch trong khoảng thời gian này");
        if (vehicleRouteRepository.hasDriverConflict(driver.getId(), start, end))
            throw new ApiException(HttpStatus.CONFLICT, "Tài xế đã có lịch trong khoảng thời gian này");

        VehicleRoute vr = VehicleRoute.builder()
                .vehicle(vehicle)
                .driver(driver)
                .route(route)
                .departureTime(req.getDepartureTime())
                .status(Status.SCHEDULED)
                .build();

        return vehicleRouteRepository.save(vr);
    }

    @Transactional
    public VehicleRoute updateStatus(Long id, String status, Long ownerId) {
        VehicleRoute vr = vehicleRouteRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy phân công"));
        if (!List.of(Status.SCHEDULED, Status.COMPLETED, Status.CANCELLED).contains(status))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
        BusCompany company = busCompanyService.getByOwnerId(ownerId);
        if (!vr.getVehicle().getBusCompany().getId().equals(company.getId()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không phải phân công của bạn");
        vr.setStatus(status);
        return vehicleRouteRepository.save(vr);
    }

    @Transactional
    public void delete(Long id, Long ownerId) {
        VehicleRoute vr = vehicleRouteRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy phân công"));
        BusCompany company = busCompanyService.getByOwnerId(ownerId);
        if (!vr.getVehicle().getBusCompany().getId().equals(company.getId()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không phải phân công của bạn");
        reviewRepository.deleteByTicketVehicleRouteIdIn(List.of(id));
        ticketRepository.deleteByVehicleRouteIdIn(List.of(id));
        vehicleRouteRepository.delete(vr);
    }
}
