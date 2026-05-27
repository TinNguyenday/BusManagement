package com.busmanagement.entity;

public final class Status {

    private Status() {}

    // User / Company shared
    public static final String ACTIVE   = "ACTIVE";
    public static final String PENDING  = "PENDING";
    public static final String REJECTED = "REJECTED";

    // Company only
    public static final String APPROVED = "APPROVED";

    // VehicleRoute
    public static final String SCHEDULED = "SCHEDULED";
    public static final String COMPLETED = "COMPLETED";
    public static final String CANCELLED = "CANCELLED";

    // Ticket
    public static final String BOOKED = "BOOKED";

    // Auth providers
    public static final String LOCAL  = "LOCAL";
    public static final String GOOGLE = "GOOGLE";
}
