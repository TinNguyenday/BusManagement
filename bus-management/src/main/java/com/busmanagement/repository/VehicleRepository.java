package com.busmanagement.repository;

import com.busmanagement.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    boolean existsByLicensePlate(String licensePlate);
    List<Vehicle> findByBusCompanyId(Long busCompanyId);
}
