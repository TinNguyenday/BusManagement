package com.busmanagement.service;

import com.busmanagement.dto.request.VehicleRequest;
import com.busmanagement.entity.BusCompany;
import com.busmanagement.entity.Status;
import com.busmanagement.entity.Vehicle;
import com.busmanagement.entity.VehicleRoute;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.TicketRepository;
import com.busmanagement.repository.VehicleRepository;
import com.busmanagement.repository.VehicleRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleRouteRepository vehicleRouteRepository;
    private final TicketRepository ticketRepository;
    private final BusCompanyService busCompanyService;

    public List<Vehicle> getAll() {
        return vehicleRepository.findAll();
    }

    public List<Vehicle> getByOwner(Long ownerId) {
        BusCompany company = busCompanyService.getByOwnerId(ownerId);
        return vehicleRepository.findByBusCompanyId(company.getId());
    }

    public List<Vehicle> getByCompanyId(Long companyId) {
        return vehicleRepository.findByBusCompanyId(companyId);
    }

    public Vehicle create(VehicleRequest req, Long ownerId) {
        if (vehicleRepository.existsByLicensePlate(req.getLicensePlate()))
            throw new ApiException(HttpStatus.CONFLICT, "Biển số đã tồn tại");

        BusCompany company = busCompanyService.getByOwnerId(ownerId);
        if (!Status.APPROVED.equals(company.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Nhà xe chưa được duyệt");

        Vehicle vehicle = Vehicle.builder()
                .busCompany(company)
                .licensePlate(req.getLicensePlate())
                .model(req.getModel())
                .seatCount(req.getSeatCount())
                .vehicleType(req.getVehicleType())
                .build();

        return vehicleRepository.save(vehicle);
    }

    public Vehicle update(Long vehicleId, VehicleRequest req, Long ownerId) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy xe"));
        if (!v.getBusCompany().getOwner().getId().equals(ownerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không phải xe của bạn");
        if (!v.getLicensePlate().equals(req.getLicensePlate()) && vehicleRepository.existsByLicensePlate(req.getLicensePlate()))
            throw new ApiException(HttpStatus.CONFLICT, "Biển số đã tồn tại");
        v.setLicensePlate(req.getLicensePlate());
        v.setModel(req.getModel());
        v.setSeatCount(req.getSeatCount());
        v.setVehicleType(req.getVehicleType());
        return vehicleRepository.save(v);
    }

    public Vehicle updateType(Long vehicleId, String vehicleType, Long ownerId) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy xe"));
        if (!v.getBusCompany().getOwner().getId().equals(ownerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không phải xe của bạn");
        v.setVehicleType(vehicleType);
        return vehicleRepository.save(v);
    }

    @Transactional
    public void delete(Long vehicleId, Long ownerId) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy xe"));
        if (!v.getBusCompany().getOwner().getId().equals(ownerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không phải xe của bạn");
        if (vehicleRouteRepository.existsByVehicleIdAndStatus(vehicleId, Status.SCHEDULED))
            throw new ApiException(HttpStatus.CONFLICT, "Xe đang có chuyến SCHEDULED, hãy xóa hoặc hủy phân công trước");

        List<VehicleRoute> routes = vehicleRouteRepository.findByVehicleId(vehicleId);
        if (!routes.isEmpty()) {
            List<Long> routeIds = routes.stream().map(VehicleRoute::getId).toList();
            ticketRepository.deleteByVehicleRouteIdIn(routeIds);
            vehicleRouteRepository.deleteAll(routes);
        }
        vehicleRepository.delete(v);
    }
}
