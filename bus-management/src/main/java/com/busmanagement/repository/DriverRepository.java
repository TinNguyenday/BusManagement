package com.busmanagement.repository;

import com.busmanagement.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    boolean existsByLicenseNumber(String licenseNumber);
    List<Driver> findByBusCompanyId(Long busCompanyId);
}
