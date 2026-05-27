package com.busmanagement.service;

import com.busmanagement.dto.request.BookRoundTripRequest;
import com.busmanagement.dto.request.BookTicketRequest;
import com.busmanagement.entity.Status;
import com.busmanagement.entity.Ticket;
import com.busmanagement.entity.User;
import com.busmanagement.entity.VehicleRoute;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.TicketRepository;
import com.busmanagement.repository.UserRepository;
import com.busmanagement.repository.VehicleRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final VehicleRouteRepository vehicleRouteRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public List<Ticket> getMyTickets(Long customerId) {
        return ticketRepository.findByCustomerIdOrderByBookedAtDesc(customerId);
    }

    public List<Ticket> getTicketGroup(String groupCode, Long customerId) {
        List<Ticket> tickets = ticketRepository.findByBookingGroupCode(groupCode);
        if (tickets.isEmpty() || !tickets.get(0).getCustomer().getId().equals(customerId))
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm vé");
        return tickets;
    }

    @Transactional
    public Ticket bookTicket(Long customerId, BookTicketRequest req) {
        User customer = findCustomer(customerId);
        // Fix #1: lock the route row to prevent concurrent seat conflicts
        VehicleRoute route = vehicleRouteRepository.findByIdForUpdate(req.getVehicleRouteId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyến xe"));

        Ticket ticket = buildTicket(customer, route, req.getSeatNumber(), null);
        Ticket saved = ticketRepository.save(ticket);
        emailService.sendBookingConfirmation(saved);
        return saved;
    }

    @Transactional
    public List<Ticket> bookRoundTrip(Long customerId, BookRoundTripRequest req) {
        User customer = findCustomer(customerId);

        // Fix #1: lock both route rows before checking seats
        VehicleRoute outboundRoute = vehicleRouteRepository.findByIdForUpdate(req.getOutboundRouteId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyến đi"));
        VehicleRoute returnRoute = vehicleRouteRepository.findByIdForUpdate(req.getReturnRouteId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyến về"));

        if (outboundRoute.getDepartureTime().isAfter(returnRoute.getDepartureTime()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chuyến về phải sau chuyến đi");

        String groupCode = UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        Ticket outbound     = buildTicket(customer, outboundRoute, req.getOutboundSeat(), groupCode);
        Ticket returnTicket = buildTicket(customer, returnRoute,   req.getReturnSeat(),   groupCode);

        Ticket savedOutbound = ticketRepository.save(outbound);
        Ticket savedReturn   = ticketRepository.save(returnTicket);

        emailService.sendBookingConfirmation(savedOutbound);
        emailService.sendBookingConfirmation(savedReturn);

        return List.of(savedOutbound, savedReturn);
    }

    @Transactional
    public Ticket cancelTicket(Long ticketId, Long customerId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy vé"));

        if (!ticket.getCustomer().getId().equals(customerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không có quyền hủy vé này");

        if (!Status.BOOKED.equals(ticket.getStatus()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vé đã bị hủy trước đó");

        ticket.setStatus(Status.CANCELLED);
        Ticket cancelled = ticketRepository.save(ticket);
        emailService.sendCancellationNotification(cancelled);
        return cancelled;
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private User findCustomer(Long customerId) {
        return userRepository.findById(customerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
    }

    private Ticket buildTicket(User customer, VehicleRoute route, int seatNumber, String groupCode) {
        if (!Status.SCHEDULED.equals(route.getStatus()))
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chuyến " + route.getId() + " không còn nhận đặt vé");

        int seatCount = route.getVehicle().getSeatCount();
        long booked = ticketRepository.countByVehicleRouteIdAndStatus(route.getId(), Status.BOOKED);
        if (booked >= seatCount)
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chuyến " + route.getId() + " đã hết chỗ");

        if (seatNumber < 1 || seatNumber > seatCount)
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Số ghế không hợp lệ (1-" + seatCount + ")");

        List<Integer> takenSeats = ticketRepository.findTakenSeatsByRouteId(route.getId());
        if (takenSeats.contains(seatNumber))
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ghế số " + seatNumber + " đã được đặt (chuyến " + route.getId() + ")");

        return Ticket.builder()
                .customer(customer)
                .vehicleRoute(route)
                .bookingCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .seatNumber(seatNumber)
                .status(Status.BOOKED)
                .bookingGroupCode(groupCode)
                .build();
    }
}
