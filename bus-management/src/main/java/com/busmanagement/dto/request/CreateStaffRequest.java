package com.busmanagement.dto.request;

import lombok.Data;

@Data
public class CreateStaffRequest {
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String phone;
}
