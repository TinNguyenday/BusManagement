package com.busmanagement.repository;

import com.busmanagement.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteRepository extends JpaRepository<Route, Long> {
    boolean existsByOriginAndDestination(String origin, String destination);
}
