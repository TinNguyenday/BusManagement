package com.busmanagement.repository;

import com.busmanagement.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByTicketId(Long ticketId);

    @Query("SELECT r FROM Review r WHERE r.ticket.vehicleRoute.id = :vehicleRouteId ORDER BY r.createdAt DESC")
    List<Review> findByVehicleRouteId(@Param("vehicleRouteId") Long vehicleRouteId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.ticket.vehicleRoute.id = :vehicleRouteId")
    Double getAverageRatingByVehicleRouteId(@Param("vehicleRouteId") Long vehicleRouteId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.ticket.vehicleRoute.id = :vehicleRouteId")
    Integer getReviewCountByVehicleRouteId(@Param("vehicleRouteId") Long vehicleRouteId);

    // Fix #2: delete reviews whose tickets belong to given routes (before deleting the tickets)
    @Modifying
    @Query("DELETE FROM Review r WHERE r.ticket.vehicleRoute.id IN :routeIds")
    void deleteByTicketVehicleRouteIdIn(@Param("routeIds") List<Long> routeIds);

    @Modifying
    @Query("DELETE FROM Review r WHERE r.ticket.customer.id = :customerId")
    void deleteByCustomerId(@Param("customerId") Long customerId);
}
