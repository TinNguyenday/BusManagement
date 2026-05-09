package com.busmanagement.service;

import com.busmanagement.dto.request.ReviewRequest;
import com.busmanagement.dto.response.ReviewResponse;
import com.busmanagement.entity.Review;
import com.busmanagement.entity.Ticket;
import com.busmanagement.exception.ApiException;
import com.busmanagement.repository.ReviewRepository;
import com.busmanagement.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public ReviewResponse submitReview(Long customerId, ReviewRequest req) {
        Ticket ticket = ticketRepository.findById(req.getTicketId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy vé"));

        if (!ticket.getCustomer().getId().equals(customerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Không có quyền đánh giá vé này");

        if (!"COMPLETED".equals(ticket.getVehicleRoute().getStatus()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ có thể đánh giá chuyến đã hoàn thành");

        if (reviewRepository.findByTicketId(ticket.getId()).isPresent())
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã đánh giá chuyến này rồi");

        Review review = Review.builder()
                .ticket(ticket)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        return toResponse(saved);
    }

    public List<ReviewResponse> getReviewsByVehicleRoute(Long vehicleRouteId) {
        return reviewRepository.findByVehicleRouteId(vehicleRouteId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getTicket().getId(),
                r.getTicket().getCustomer().getFullName(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
