package com.busmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BusManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(BusManagementApplication.class, args);
    }
}
