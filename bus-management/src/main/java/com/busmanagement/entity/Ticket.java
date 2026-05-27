package com.busmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_route_id", nullable = false)
    private VehicleRoute vehicleRoute;

    @Column(unique = true, nullable = false)
    private String bookingCode;

    @Column(name = "seat_number")
    private Integer seatNumber;

    @Column(name = "booking_group_code")
    private String bookingGroupCode;

    @Column(nullable = false)
    @Builder.Default
    private String status = Status.BOOKED;

    @Column(nullable = false)
    private LocalDateTime bookedAt;

    @PrePersist
    protected void onCreate() {
        this.bookedAt = LocalDateTime.now();
    }
}
