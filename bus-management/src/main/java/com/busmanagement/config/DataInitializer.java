package com.busmanagement.config;

import com.busmanagement.entity.*;
import com.busmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

        private final RoleRepository roleRepository;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final BusCompanyRepository busCompanyRepository;
        private final VehicleRepository vehicleRepository;
        private final DriverRepository driverRepository;
        private final RouteRepository routeRepository;
        private final VehicleRouteRepository vehicleRouteRepository;

        @Override
        @Transactional
        public void run(String... args) {

                createRoleIfNotExists(RoleName.ADMIN);
                createRoleIfNotExists(RoleName.STAFF);
                createRoleIfNotExists(RoleName.OWNER);
                createRoleIfNotExists(RoleName.CUSTOMER);

                if (!userRepository.existsByUsername("admin")) {
                        Role adminRole = roleRepository.findByName(RoleName.ADMIN).orElseThrow();
                        userRepository.save(User.builder()
                                        .username("admin").email("admin@busgo.vn")
                                        .passwordHash(passwordEncoder.encode("admin123"))
                                        .fullName("System Admin").phone("0900000000")
                                        .role(adminRole).authProvider(Status.LOCAL).status(Status.ACTIVE).build());
                        log.info("✓ admin / admin123");
                }

                if (!userRepository.existsByUsername("staff1")) {
                        Role staffRole = roleRepository.findByName(RoleName.STAFF).orElseThrow();
                        userRepository.save(User.builder()
                                        .username("staff1").email("staff1@busgo.vn")
                                        .passwordHash(passwordEncoder.encode("staff123"))
                                        .fullName("Nguyễn Trọng A").phone("0100000001")
                                        .role(staffRole).authProvider(Status.LOCAL).status(Status.ACTIVE).build());
                        log.info("✓ staff1 / staff123");
                }

                if (!userRepository.existsByUsername("owner1")) {
                        Role ownerRole = roleRepository.findByName(RoleName.OWNER).orElseThrow();
                        User owner = userRepository.save(User.builder()
                                        .username("owner1").email("owner1@busgo.vn")
                                        .passwordHash(passwordEncoder.encode("owner123"))
                                        .fullName("Trần Văn Hùng").phone("0901234567")
                                        .role(ownerRole).authProvider(Status.LOCAL).status(Status.ACTIVE).build());

                        BusCompany company = busCompanyRepository.save(BusCompany.builder()
                                        .owner(owner)
                                        .companyName("Nhà xe Thành Công")
                                        .address("123 Lê Lợi, Quận 1, TP.HCM")
                                        .phone("0901234567")
                                        .idCardNumber("079012345678")
                                        .bankAccountNumber("1234567890")
                                        .bankName("Vietcombank")
                                        .status(Status.APPROVED)
                                        .build());

                        seedVehiclesDriversRoutes(company);
                        log.info("✓ owner1 / owner123  →  Nhà xe Thành Công");
                }

                refreshFutureRoutesIfNeeded();

                if (!userRepository.existsByUsername("customer1")) {
                        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER).orElseThrow();
                        userRepository.save(User.builder()
                                        .username("customer1").email("customer1@busgo.vn")
                                        .passwordHash(passwordEncoder.encode("customer123"))
                                        .fullName("Lê Thị Lan").phone("0912345678")
                                        .role(customerRole).authProvider(Status.LOCAL).status(Status.ACTIVE).build());
                        log.info("✓ customer1 / customer123");
                }
        }

        private void seedVehiclesDriversRoutes(BusCompany company) {

                Vehicle v1 = vehicleRepository.save(Vehicle.builder()
                                .busCompany(company).licensePlate("51B-123.45")
                                .model("Thaco Trường Hải").seatCount(45).vehicleType("Xe giường nằm").build());

                Vehicle v2 = vehicleRepository.save(Vehicle.builder()
                                .busCompany(company).licensePlate("51B-678.90")
                                .model("Fuso Rosa").seatCount(29).vehicleType("Xe limousine").build());

                Driver d1 = driverRepository.save(Driver.builder()
                                .busCompany(company).fullName("Nguyễn Văn Tài")
                                .phone("0912000001").idCardNumber("079087654321")
                                .licenseNumber("LX001234").licenseClass("D")
                                .licenseExpiry(LocalDate.of(2027, 6, 30)).build());

                Driver d2 = driverRepository.save(Driver.builder()
                                .busCompany(company).fullName("Trần Minh Đức")
                                .phone("0912000002").idCardNumber("079087654322")
                                .licenseNumber("LX005678").licenseClass("E")
                                .licenseExpiry(LocalDate.of(2026, 12, 31)).build());

                driverRepository.save(Driver.builder()
                                .busCompany(company).fullName("Phạm Văn Bình")
                                .phone("0912000003").idCardNumber("079087654323")
                                .licenseNumber("LX009001").licenseClass("D")
                                .licenseExpiry(LocalDate.of(2025, 6, 23)).build());

                driverRepository.save(Driver.builder()
                                .busCompany(company).fullName("Lê Văn Cường")
                                .phone("0912000004").idCardNumber("079087654324")
                                .licenseNumber("LX009002").licenseClass("E")
                                .licenseExpiry(LocalDate.of(2028, 12, 31)).build());

                Route r1 = routeRepository.save(Route.builder()
                                .name("Hà Nội - TP.HCM").origin("Hà Nội").destination("TP.HCM")
                                .distanceKm(1726).estimatedDurationMin(1800)
                                .basePrice(new BigDecimal("350000")).build());

                Route r2 = routeRepository.save(Route.builder()
                                .name("TP.HCM - Đà Nẵng").origin("TP.HCM").destination("Đà Nẵng")
                                .distanceKm(964).estimatedDurationMin(960)
                                .basePrice(new BigDecimal("200000")).build());

                Route r3 = routeRepository.save(Route.builder()
                                .name("Hà Nội - Đà Nẵng").origin("Hà Nội").destination("Đà Nẵng")
                                .distanceKm(763).estimatedDurationMin(840)
                                .basePrice(new BigDecimal("250000")).build());

                LocalDateTime base = LocalDateTime.now();

                vehicleRouteRepository.save(VehicleRoute.builder()
                                .vehicle(v1).driver(d1).route(r1)
                                .departureTime(base.plusDays(1).withHour(8).withMinute(0).withSecond(0))
                                .status(Status.SCHEDULED).build());

                vehicleRouteRepository.save(VehicleRoute.builder()
                                .vehicle(v2).driver(d2).route(r2)
                                .departureTime(base.plusDays(1).withHour(14).withMinute(0).withSecond(0))
                                .status(Status.SCHEDULED).build());

                vehicleRouteRepository.save(VehicleRoute.builder()
                                .vehicle(v1).driver(d2).route(r3)
                                .departureTime(base.plusDays(2).withHour(20).withMinute(0).withSecond(0))
                                .status(Status.SCHEDULED).build());

                vehicleRouteRepository.save(VehicleRoute.builder()
                                .vehicle(v2).driver(d1).route(r1)
                                .departureTime(base.plusDays(3).withHour(7).withMinute(30).withSecond(0))
                                .status(Status.SCHEDULED).build());

                log.info(" Data mẫu: 2 xe, 2 tài xế, 3 tuyến, 4 chuyến sắp tới");
        }

        private void refreshFutureRoutesIfNeeded() {
                LocalDateTime now = LocalDateTime.now();
                if (!vehicleRouteRepository.findAllScheduled(now).isEmpty()) return;

                userRepository.findByUsername("owner1").flatMap(owner ->
                        busCompanyRepository.findByOwnerId(owner.getId())
                ).ifPresent(company -> {
                        List<Vehicle> vehicles = vehicleRepository.findByBusCompanyId(company.getId());
                        List<Driver> drivers = driverRepository.findByBusCompanyId(company.getId());
                        List<Route> routes = routeRepository.findAll();
                        if (vehicles.size() < 2 || drivers.size() < 2 || routes.isEmpty()) return;

                        vehicleRouteRepository.save(VehicleRoute.builder()
                                .vehicle(vehicles.get(0)).driver(drivers.get(0)).route(routes.get(0))
                                .departureTime(now.plusDays(1).withHour(8).withMinute(0).withSecond(0))
                                .status(Status.SCHEDULED).build());
                        vehicleRouteRepository.save(VehicleRoute.builder()
                                .vehicle(vehicles.get(1)).driver(drivers.get(1)).route(routes.get(1 % routes.size()))
                                .departureTime(now.plusDays(1).withHour(14).withMinute(0).withSecond(0))
                                .status(Status.SCHEDULED).build());
                        vehicleRouteRepository.save(VehicleRoute.builder()
                                .vehicle(vehicles.get(0)).driver(drivers.get(1)).route(routes.get(2 % routes.size()))
                                .departureTime(now.plusDays(2).withHour(20).withMinute(0).withSecond(0))
                                .status(Status.SCHEDULED).build());
                        vehicleRouteRepository.save(VehicleRoute.builder()
                                .vehicle(vehicles.get(1)).driver(drivers.get(0)).route(routes.get(0))
                                .departureTime(now.plusDays(3).withHour(7).withMinute(30).withSecond(0))
                                .status(Status.SCHEDULED).build());
                        log.info("✓ Refreshed: 4 chuyến mới vì tất cả đã quá hạn");
                });
        }

        private void createRoleIfNotExists(String name) {
                if (roleRepository.findByName(name).isEmpty()) {
                        roleRepository.save(Role.builder().name(name).build());
                        log.info("✓ Role: {}", name);
                }
        }
}
