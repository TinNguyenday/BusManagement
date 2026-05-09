package com.busmanagement.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class DriverRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    @Pattern(regexp = "^[0-9]{10,11}$")
    private String phone;

    @NotBlank
    @Pattern(regexp = "^[0-9]{9,12}$")
    private String idCardNumber;

    @NotBlank
    private String licenseNumber;

    @NotBlank
    private String licenseClass;

    private LocalDate licenseExpiry;
}
