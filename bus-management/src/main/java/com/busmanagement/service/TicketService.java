package com.busmanagement.service;

import com.busmanagement.dto.request.BookTicketRequest;
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

    public List<Ticket> getMyTickets(Long customerId) {
        return ticketRepository.findByCustomerIdOrderByBookedAtDesc(customerId);
    }

    @Transactional
    public Ticket bookTicket(Long customerId, BookTicketRequest req) {
        VehicleRoute route = vehicleRouteRepository.findById(req.getVehicleRouteId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyến xe"));

        if (!"SCHEDULED".equals(route.getStatus()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chuyến xe này không còn nhận đặt vé");

        int seatCount = route.getVehicle().getSeatCount();
        long booked = ticketRepository.countByVehicleRouteIdAndStatus(route.getId(), "BOOKED");
        if (booked >= seatCount)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chuyến xe đã hết chỗ");

        int seatNumber = req.getSeatNumber();
        if (seatNumber < 1 || seatNumber > seatCount)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số ghế không hợp lệ (1-" + seatCount + ")");

        List<Integer> takenSeats = ticketRepository.findTakenSeatsByRouteId(route.getId());
        if (takenSeats.contains(seatNumber))
            throw new ApiException(HttpStatus.CONFLICT, "Ghế số " + seatNumber + " đã được đặt");

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));

        String bookingCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Ticket ticket = Ticket.builder()
                .customer(customer)
                .vehicleRoute(route)
                .bookingCode(bookingCode)
                .seatNumber(seatNumber)
                .status("BOOKED")
                .build();

        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket cancelTicket(Long ticketId, Long customerId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy vé"));

        if (!ticket.getCustomer().getId().equals(customerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không có quyền hủy vé này");

        if (!"BOOKED".equals(ticket.getStatus()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vé đã bị hủy trước đó");

        ticket.setStatus("CANCELLED");
        return ticketRepository.save(ticket);
    }
}
