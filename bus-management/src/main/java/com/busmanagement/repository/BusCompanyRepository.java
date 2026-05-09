package com.busmanagement.repository;

import com.busmanagement.entity.BusCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BusCompanyRepository extends JpaRepository<BusCompany, Long> {
    List<BusCompany> findByStatus(String status);
    Optional<BusCompany> findByOwnerId(Long ownerId);
}
