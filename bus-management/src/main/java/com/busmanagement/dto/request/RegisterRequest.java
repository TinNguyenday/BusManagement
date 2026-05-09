package com.busmanagement.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Username không được trống")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    private String password;

    @NotBlank
    private String fullName;

    @NotBlank
    @Pattern(regexp = "^[0-9]{10,11}$", message = "SĐT 10-11 số")
    private String phone;

    // Thông tin công ty (bắt buộc cho OWNER)
    @NotBlank(message = "Tên công ty không được trống")
    private String companyName;

    @NotBlank
    private String address;

    @NotBlank
    @Pattern(regexp = "^[0-9]{9,12}$", message = "CMND/CCCD 9-12 số")
    private String idCardNumber;

    @NotBlank
    private String bankAccountNumber;

    @NotBlank
    private String bankName;
}
