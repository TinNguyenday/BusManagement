package com.busmanagement.repository;

import com.busmanagement.entity.VehicleRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface VehicleRouteRepository extends JpaRepository<VehicleRoute, Long> {

    @Query("SELECT COUNT(vr) > 0 FROM VehicleRoute vr " +
           "WHERE vr.vehicle.id = :vehicleId " +
           "AND vr.departureTime BETWEEN :start AND :end")
    boolean hasVehicleConflict(@Param("vehicleId") Long vehicleId,
                               @Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(vr) > 0 FROM VehicleRoute vr " +
           "WHERE vr.driver.id = :driverId " +
           "AND vr.departureTime BETWEEN :start AND :end")
    boolean hasDriverConflict(@Param("driverId") Long driverId,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end);

    @Query("SELECT vr FROM VehicleRoute vr WHERE vr.vehicle.busCompany.id = :companyId")
    List<VehicleRoute> findByBusCompanyId(@Param("companyId") Long companyId);

    boolean existsByVehicleIdAndStatus(Long vehicleId, String status);

    boolean existsByDriverIdAndStatus(Long driverId, String status);

    List<VehicleRoute> findByVehicleId(Long vehicleId);

    List<VehicleRoute> findByDriverId(Long driverId);

    @Query("SELECT vr FROM VehicleRoute vr WHERE vr.status = 'SCHEDULED' AND vr.departureTime >= :now ORDER BY vr.departureTime ASC")
    List<VehicleRoute> findAllScheduled(@Param("now") LocalDateTime now);
}
