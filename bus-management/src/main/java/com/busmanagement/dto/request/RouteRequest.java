package com.busmanagement.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RouteRequest {

    @NotBlank(message = "Tên tuyến không được trống")
    private String name;

    @NotBlank(message = "Nơi đi không được trống")
    private String origin;

    @NotBlank(message = "Nơi đến không được trống")
    private String destination;

    @Min(value = 1, message = "Khoảng cách phải > 0")
    private Integer distanceKm;

    @Min(value = 1)
    private Integer estimatedDurationMin;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải > 0")
    private BigDecimal basePrice;
}
