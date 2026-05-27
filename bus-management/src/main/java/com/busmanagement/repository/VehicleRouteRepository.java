package com.busmanagement.repository;

import com.busmanagement.entity.VehicleRoute;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VehicleRouteRepository extends JpaRepository<VehicleRoute, Long> {

    // Fix #1: pessimistic write lock — prevents concurrent seat booking on same route
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT vr FROM VehicleRoute vr WHERE vr.id = :id")
    Optional<VehicleRoute> findByIdForUpdate(@Param("id") Long id);

    // Fix #4: exclude CANCELLED routes from conflict checks
    @Query("SELECT COUNT(vr) > 0 FROM VehicleRoute vr " +
           "WHERE vr.vehicle.id = :vehicleId " +
           "AND vr.status = 'SCHEDULED' " +
           "AND vr.departureTime BETWEEN :start AND :end")
    boolean hasVehicleConflict(@Param("vehicleId") Long vehicleId,
                               @Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(vr) > 0 FROM VehicleRoute vr " +
           "WHERE vr.driver.id = :driverId " +
           "AND vr.status = 'SCHEDULED' " +
           "AND vr.departureTime BETWEEN :start AND :end")
    boolean hasDriverConflict(@Param("driverId") Long driverId,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end);

    @Query("SELECT vr FROM VehicleRoute vr WHERE vr.vehicle.busCompany.id = :companyId")
    List<VehicleRoute> findByBusCompanyId(@Param("companyId") Long companyId);

    boolean existsByVehicleIdAndStatus(Long vehicleId, String status);

    boolean existsByDriverIdAndStatus(Long driverId, String status);

    // Fix #3: check before deleting a route
    boolean existsByRouteId(Long routeId);

    List<VehicleRoute> findByVehicleId(Long vehicleId);

    List<VehicleRoute> findByDriverId(Long driverId);

    @Query("SELECT vr FROM VehicleRoute vr WHERE vr.status = 'SCHEDULED' AND vr.departureTime >= :now ORDER BY vr.departureTime ASC")
    List<VehicleRoute> findAllScheduled(@Param("now") LocalDateTime now);

    @Query("SELECT vr FROM VehicleRoute vr WHERE vr.status = 'SCHEDULED' AND vr.departureTime < :now")
    List<VehicleRoute> findScheduledDeparted(@Param("now") LocalDateTime now);

    @Query("SELECT vr FROM VehicleRoute vr WHERE vr.route.id = :routeId AND vr.status = 'SCHEDULED' AND vr.departureTime >= :now ORDER BY vr.departureTime ASC")
    List<VehicleRoute> findScheduledByRouteId(@Param("routeId") Long routeId, @Param("now") LocalDateTime now);
}
