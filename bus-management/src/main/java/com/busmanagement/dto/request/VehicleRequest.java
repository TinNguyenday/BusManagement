package com.busmanagement.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VehicleRequest {

    @NotBlank(message = "Biển số không được trống")
    private String licensePlate;

    @NotBlank
    private String model;

    @NotNull
    @Min(value = 4, message = "Số ghế tối thiểu 4")
    @Max(value = 60)
    private Integer seatCount;

    private String vehicleType;
}
