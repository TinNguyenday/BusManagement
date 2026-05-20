package com.busmanagement.service;

import com.busmanagement.entity.VehicleRoute;
import com.busmanagement.repository.VehicleRouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AssignmentScheduler {

    private final VehicleRouteRepository vehicleRouteRepository;

    // Chạy mỗi phút
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void autoCompleteAssignments() {
        LocalDateTime now = LocalDateTime.now();

        List<VehicleRoute> departed = vehicleRouteRepository.findScheduledDeparted(now);
        if (departed.isEmpty()) return;

        int count = 0;
        for (VehicleRoute vr : departed) {
            Integer durationMin = vr.getRoute().getEstimatedDurationMin();
            // Nếu route không có duration, mặc định coi là hoàn thành sau 1 giờ kể từ giờ khởi hành
            long minutesAfterDeparture = durationMin != null ? durationMin : 60;
            LocalDateTime completionTime = vr.getDepartureTime().plusMinutes(minutesAfterDeparture);

            if (now.isAfter(completionTime)) {
                vr.setStatus("COMPLETED");
                vehicleRouteRepository.save(vr);
                count++;
            }
        }

        if (count > 0) {
            log.info("Auto-completed {} assignment(s)", count);
        }
    }
}
