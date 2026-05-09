package com.busmanagement.repository;

import com.busmanagement.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCustomerIdOrderByBookedAtDesc(Long customerId);
    long countByVehicleRouteIdAndStatus(Long vehicleRouteId, String status);

    @Query("SELECT t.seatNumber FROM Ticket t WHERE t.vehicleRoute.id = :routeId AND t.status = 'BOOKED'")
    List<Integer> findTakenSeatsByRouteId(@Param("routeId") Long routeId);

    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.vehicleRoute.id IN :routeIds")
    void deleteByVehicleRouteIdIn(@Param("routeIds") List<Long> routeIds);
}
