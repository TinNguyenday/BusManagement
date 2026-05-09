package com.busmanagement.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignmentRequest {

    @NotNull
    private Long vehicleId;

    @NotNull
    private Long driverId;

    @NotNull
    private Long routeId;

    @NotNull
    private LocalDateTime departureTime;
}
