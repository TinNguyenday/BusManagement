package com.busmanagement.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookTicketRequest {

    @NotNull
    private Long vehicleRouteId;

    @NotNull
    private Integer seatNumber;
}
