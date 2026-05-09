package com.busmanagement.dto.response;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long ticketId,
        String customerName,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {}
