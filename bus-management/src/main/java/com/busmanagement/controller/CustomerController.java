package com.busmanagement.controller;

import com.busmanagement.dto.request.BookRoundTripRequest;
import com.busmanagement.dto.request.BookTicketRequest;
import com.busmanagement.dto.request.ReviewRequest;
import com.busmanagement.dto.response.ReviewResponse;
import com.busmanagement.dto.response.ScheduleSearchResponse;
import com.busmanagement.dto.response.SuggestionResponse;
import com.busmanagement.entity.Route;
import com.busmanagement.entity.Status;
import com.busmanagement.entity.Ticket;
import com.busmanagement.entity.VehicleRoute;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.ReviewRepository;
import com.busmanagement.repository.RouteRepository;
import com.busmanagement.repository.TicketRepository;
import com.busmanagement.repository.VehicleRouteRepository;
import com.busmanagement.service.ReviewService;
import com.busmanagement.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final TicketService ticketService;
    private final ReviewService reviewService;
    private final VehicleRouteRepository vehicleRouteRepository;
    private final TicketRepository ticketRepository;
    private final ReviewRepository reviewRepository;
    private final RouteRepository routeRepository;

    @GetMapping("/locations")
    public ResponseEntity<List<String>> getLocations() {
        List<String> origins = routeRepository.findDistinctOrigins();
        List<String> destinations = routeRepository.findDistinctDestinations();
        List<String> all = Stream.concat(origins.stream(), destinations.stream())
                .distinct().sorted().toList();
        return ResponseEntity.ok(all);
    }

    @GetMapping("/schedules/{id}/seats")
    public ResponseEntity<Map<String, Object>> getSeats(@PathVariable Long id) {
        VehicleRoute route = vehicleRouteRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyến xe"));
        List<Integer> takenSeats = ticketRepository.findTakenSeatsByRouteId(id);
        int total = route.getVehicle().getSeatCount();
        return ResponseEntity.ok(Map.of(
                "totalSeats", total,
                "takenSeats", takenSeats,
                "availableSeats", total - takenSeats.size()
        ));
    }

    @GetMapping("/schedules")
    public ResponseEntity<List<ScheduleSearchResponse>> searchSchedules(
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String vehicleType,
            @RequestParam(defaultValue = "time_asc") String sortBy) {

        String o  = (origin != null && !origin.isBlank())          ? origin.trim().toLowerCase()      : null;
        String d  = (destination != null && !destination.isBlank()) ? destination.trim().toLowerCase() : null;
        String vt = (vehicleType != null && !vehicleType.isBlank()) ? vehicleType.trim()               : null;

        List<VehicleRoute> all = vehicleRouteRepository.findAllScheduled(LocalDateTime.now());

        List<ScheduleSearchResponse> results = all.stream()
                .filter(vr -> o  == null || vr.getRoute().getOrigin().toLowerCase().contains(o))
                .filter(vr -> d  == null || vr.getRoute().getDestination().toLowerCase().contains(d))
                .filter(vr -> date == null || vr.getDepartureTime().toLocalDate().equals(date))
                .filter(vr -> minPrice == null || vr.getRoute().getBasePrice().compareTo(minPrice) >= 0)
                .filter(vr -> maxPrice == null || vr.getRoute().getBasePrice().compareTo(maxPrice) <= 0)
                .filter(vr -> vt == null || vt.equalsIgnoreCase(vr.getVehicle().getVehicleType()))
                .sorted(buildComparator(sortBy))
                .map(this::toSearchResponse)
                .toList();

        return ResponseEntity.ok(results);
    }

    @PostMapping("/tickets")
    public ResponseEntity<Ticket> bookTicket(@Valid @RequestBody BookTicketRequest req,
                                             @AuthenticationPrincipal Long customerId) {
        return ResponseEntity.ok(ticketService.bookTicket(customerId, req));
    }

    @PostMapping("/tickets/round-trip")
    public ResponseEntity<List<Ticket>> bookRoundTrip(@Valid @RequestBody BookRoundTripRequest req,
                                                      @AuthenticationPrincipal Long customerId) {
        return ResponseEntity.ok(ticketService.bookRoundTrip(customerId, req));
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<Ticket>> myTickets(@AuthenticationPrincipal Long customerId) {
        return ResponseEntity.ok(ticketService.getMyTickets(customerId));
    }

    @GetMapping("/tickets/group/{groupCode}")
    public ResponseEntity<List<Ticket>> getTicketGroup(@PathVariable String groupCode,
                                                       @AuthenticationPrincipal Long customerId) {
        return ResponseEntity.ok(ticketService.getTicketGroup(groupCode, customerId));
    }

    @PutMapping("/tickets/{id}/cancel")
    public ResponseEntity<Ticket> cancelTicket(@PathVariable Long id,
                                               @AuthenticationPrincipal Long customerId) {
        return ResponseEntity.ok(ticketService.cancelTicket(id, customerId));
    }

    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponse> submitReview(@Valid @RequestBody ReviewRequest req,
                                                       @AuthenticationPrincipal Long customerId) {
        return ResponseEntity.ok(reviewService.submitReview(customerId, req));
    }

    @GetMapping("/schedules/{id}/reviews")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewsByVehicleRoute(id));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<SuggestionResponse>> getSuggestions() {
        LocalDateTime now = LocalDateTime.now();

        List<Object[]> popular = ticketRepository.findPopularRouteIdsWithCount();
        List<Long> routeIds = popular.isEmpty()
                ? routeRepository.findAll().stream().map(Route::getId).toList()
                : popular.stream().map(row -> (Long) row[0]).toList();

        List<SuggestionResponse> suggestions = routeIds.stream()
                .limit(6)
                .map(routeId -> routeRepository.findById(routeId).map(route -> {
                    List<VehicleRoute> upcoming = vehicleRouteRepository.findScheduledByRouteId(routeId, now);
                    LocalDateTime nextDep = upcoming.isEmpty() ? null : upcoming.get(0).getDepartureTime();
                    BigDecimal lowestPrice = upcoming.isEmpty() ? route.getBasePrice() : upcoming.stream()
                            .map(vr -> vr.getRoute().getBasePrice())
                            .min(BigDecimal::compareTo)
                            .orElse(route.getBasePrice());
                    Long bookings = ticketRepository.countByRouteId(routeId);
                    return new SuggestionResponse(
                            routeId,
                            route.getOrigin(),
                            route.getDestination(),
                            route.getName(),
                            lowestPrice,
                            nextDep,
                            upcoming.size(),
                            bookings
                    );
                }).orElse(null))
                .filter(Objects::nonNull)
                .toList();

        return ResponseEntity.ok(suggestions);
    }

    private Comparator<VehicleRoute> buildComparator(String sortBy) {
        return switch (sortBy) {
            case "price_asc"  -> Comparator.comparing(vr -> vr.getRoute().getBasePrice());
            case "price_desc" -> Comparator.comparing((VehicleRoute vr) -> vr.getRoute().getBasePrice()).reversed();
            default           -> Comparator.comparing(VehicleRoute::getDepartureTime);
        };
    }

    private ScheduleSearchResponse toSearchResponse(VehicleRoute vr) {
        long booked = ticketRepository.countByVehicleRouteIdAndStatus(vr.getId(), Status.BOOKED);
        int total = vr.getVehicle().getSeatCount();
        Double avgRating = reviewRepository.getAverageRatingByVehicleRouteId(vr.getId());
        Integer reviewCount = reviewRepository.getReviewCountByVehicleRouteId(vr.getId());
        return new ScheduleSearchResponse(
                vr.getId(),
                vr.getVehicle().getBusCompany().getCompanyName(),
                vr.getVehicle().getBusCompany().getPhone(),
                vr.getRoute().getOrigin(),
                vr.getRoute().getDestination(),
                vr.getDepartureTime(),
                vr.getRoute().getEstimatedDurationMin(),
                vr.getRoute().getDistanceKm(),
                vr.getRoute().getBasePrice(),
                (int) (total - booked),
                total,
                vr.getVehicle().getVehicleType(),
                vr.getVehicle().getModel(),
                vr.getDriver().getFullName(),
                avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null,
                reviewCount != null ? reviewCount : 0
        );
    }
}
