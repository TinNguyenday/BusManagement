package com.busmanagement.service;

import com.busmanagement.dto.request.DriverRequest;
import com.busmanagement.entity.BusCompany;
import com.busmanagement.entity.Driver;
import com.busmanagement.entity.Status;
import com.busmanagement.entity.VehicleRoute;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.DriverRepository;
import com.busmanagement.repository.TicketRepository;
import com.busmanagement.repository.VehicleRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final VehicleRouteRepository vehicleRouteRepository;
    private final TicketRepository ticketRepository;
    private final BusCompanyService busCompanyService;

    public List<Driver> getAll() {
        return driverRepository.findAll();
    }

    public List<Driver> getByOwner(Long ownerId) {
        BusCompany company = busCompanyService.getByOwnerId(ownerId);
        return driverRepository.findByBusCompanyId(company.getId());
    }

    public List<Driver> getByCompanyId(Long companyId) {
        return driverRepository.findByBusCompanyId(companyId);
    }

    public Driver create(DriverRequest req, Long ownerId) {
        if (driverRepository.existsByLicenseNumber(req.getLicenseNumber()))
            throw new ApiException(HttpStatus.CONFLICT, "Số GPLX đã tồn tại");

        BusCompany company = busCompanyService.getByOwnerId(ownerId);
        if (!Status.APPROVED.equals(company.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Nhà xe chưa được duyệt");

        Driver driver = Driver.builder()
                .busCompany(company)
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .idCardNumber(req.getIdCardNumber())
                .licenseNumber(req.getLicenseNumber())
                .licenseClass(req.getLicenseClass())
                .licenseExpiry(req.getLicenseExpiry())
                .build();

        return driverRepository.save(driver);
    }

    public Driver update(Long driverId, DriverRequest req, Long ownerId) {
        Driver d = driverRepository.findById(driverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài xế"));
        if (!d.getBusCompany().getOwner().getId().equals(ownerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không phải tài xế của bạn");
        if (!d.getLicenseNumber().equals(req.getLicenseNumber()) && driverRepository.existsByLicenseNumber(req.getLicenseNumber()))
            throw new ApiException(HttpStatus.CONFLICT, "Số GPLX đã tồn tại");
        d.setFullName(req.getFullName());
        d.setPhone(req.getPhone());
        d.setIdCardNumber(req.getIdCardNumber());
        d.setLicenseNumber(req.getLicenseNumber());
        d.setLicenseClass(req.getLicenseClass());
        d.setLicenseExpiry(req.getLicenseExpiry());
        return driverRepository.save(d);
    }

    @Transactional
    public void delete(Long driverId, Long ownerId) {
        Driver d = driverRepository.findById(driverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài xế"));
        if (!d.getBusCompany().getOwner().getId().equals(ownerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không phải tài xế của bạn");
        if (vehicleRouteRepository.existsByDriverIdAndStatus(driverId, Status.SCHEDULED))
            throw new ApiException(HttpStatus.CONFLICT, "Tài xế đang có chuyến SCHEDULED, hãy xóa hoặc hủy phân công trước");

        List<VehicleRoute> routes = vehicleRouteRepository.findByDriverId(driverId);
        if (!routes.isEmpty()) {
            List<Long> routeIds = routes.stream().map(VehicleRoute::getId).toList();
            ticketRepository.deleteByVehicleRouteIdIn(routeIds);
            vehicleRouteRepository.deleteAll(routes);
        }
        driverRepository.delete(d);
    }
}
