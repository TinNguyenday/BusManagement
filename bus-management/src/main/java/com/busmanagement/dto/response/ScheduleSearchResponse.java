package com.busmanagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ScheduleSearchResponse(
        Long vehicleRouteId,
        String companyName,
        String companyPhone,
        String origin,
        String destination,
        LocalDateTime departureTime,
        Integer estimatedDurationMin,
        Integer distanceKm,
        BigDecimal basePrice,
        Integer availableSeats,
        Integer totalSeats,
        String vehicleType,
        String vehicleModel,
        String driverName,
        Double averageRating,
        Integer reviewCount
) {}
