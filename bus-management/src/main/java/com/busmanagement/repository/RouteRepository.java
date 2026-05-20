package com.busmanagement.repository;

import com.busmanagement.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {
    boolean existsByOriginAndDestination(String origin, String destination);

    @Query("SELECT DISTINCT r.origin FROM Route r ORDER BY r.origin")
    List<String> findDistinctOrigins();

    @Query("SELECT DISTINCT r.destination FROM Route r ORDER BY r.destination")
    List<String> findDistinctDestinations();
}
