package com.busmanagement.service;

import com.busmanagement.entity.BusCompany;
import com.busmanagement.entity.User;
import com.busmanagement.entity.VehicleRoute;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.BusCompanyRepository;
import com.busmanagement.repository.DriverRepository;
import com.busmanagement.repository.TicketRepository;
import com.busmanagement.repository.UserRepository;
import com.busmanagement.repository.VehicleRepository;
import com.busmanagement.repository.VehicleRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusCompanyService {

    private final BusCompanyRepository busCompanyRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final VehicleRouteRepository vehicleRouteRepository;
    private final TicketRepository ticketRepository;

    public List<BusCompany> getAll() {
        return busCompanyRepository.findAll();
    }

    public List<BusCompany> getByStatus(String status) {
        return busCompanyRepository.findByStatus(status);
    }

    public BusCompany getById(Long id) {
        return busCompanyRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhà xe"));
    }

    public BusCompany getByOwnerId(Long ownerId) {
        return busCompanyRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhà xe của bạn"));
    }

    @Transactional
    public void delete(Long companyId) {
        BusCompany company = getById(companyId);

        List<VehicleRoute> routes = vehicleRouteRepository.findByBusCompanyId(companyId);
        if (!routes.isEmpty()) {
            List<Long> routeIds = routes.stream().map(VehicleRoute::getId).toList();
            ticketRepository.deleteByVehicleRouteIdIn(routeIds);
            vehicleRouteRepository.deleteAll(routes);
        }

        vehicleRepository.deleteAll(vehicleRepository.findByBusCompanyId(companyId));
        driverRepository.deleteAll(driverRepository.findByBusCompanyId(companyId));

        User owner = company.getOwner();
        busCompanyRepository.delete(company);
        userRepository.delete(owner);
    }

    @Transactional
    public BusCompany approve(Long companyId, Long adminId) {
        BusCompany company = getById(companyId);
        company.setStatus("APPROVED");
        company.setApprovedAt(LocalDateTime.now());
        company.setApprovedBy(adminId);

        User owner = company.getOwner();
        owner.setStatus("ACTIVE");
        userRepository.save(owner);

        return busCompanyRepository.save(company);
    }

    @Transactional
    public BusCompany reject(Long companyId) {
        BusCompany company = getById(companyId);
        company.setStatus("REJECTED");

        User owner = company.getOwner();
        owner.setStatus("REJECTED");
        userRepository.save(owner);

        return busCompanyRepository.save(company);
    }
}
