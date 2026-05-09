package com.busmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bus_companies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_user_id", nullable = false, unique = true)
    private User owner;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String idCardNumber;

    @Column(nullable = false)
    private String bankAccountNumber;

    @Column(nullable = false)
    private String bankName;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING / APPROVED / REJECTED

    private LocalDateTime registeredAt;
    private LocalDateTime approvedAt;
    private Long approvedBy;

    @PrePersist
    protected void onCreate() {
        this.registeredAt = LocalDateTime.now();
    }
}
