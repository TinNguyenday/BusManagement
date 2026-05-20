package com.busmanagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SuggestionResponse(
        Long routeId,
        String origin,
        String destination,
        String routeName,
        BigDecimal lowestPrice,
        LocalDateTime nextDeparture,
        Integer availableTrips,
        Long totalBookings
) {}
