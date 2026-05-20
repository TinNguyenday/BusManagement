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

    @Query("SELECT t.vehicleRoute.route.id, COUNT(t) FROM Ticket t WHERE t.status = 'BOOKED' GROUP BY t.vehicleRoute.route.id ORDER BY COUNT(t) DESC")
    List<Object[]> findPopularRouteIdsWithCount();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.vehicleRoute.route.id = :routeId AND t.status = 'BOOKED'")
    Long countByRouteId(@Param("routeId") Long routeId);

    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.vehicleRoute.id IN :routeIds")
    void deleteByVehicleRouteIdIn(@Param("routeIds") List<Long> routeIds);

    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.customer.id = :customerId")
    void deleteByCustomerId(@Param("customerId") Long customerId);
}
