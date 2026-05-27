package com.busmanagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookRoundTripRequest {

    @NotNull
    private Long outboundRouteId;

    @NotNull
    @Min(1)
    private Integer outboundSeat;

    @NotNull
    private Long returnRouteId;

    @NotNull
    @Min(1)
    private Integer returnSeat;
}
