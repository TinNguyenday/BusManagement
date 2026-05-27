package com.busmanagement.service;

import com.busmanagement.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public void check(String ip) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = attempts.computeIfAbsent(ip, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS)
                timestamps.pollFirst();
            if (timestamps.size() >= MAX_ATTEMPTS)
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút");
            timestamps.addLast(now);
        }
    }

    @Scheduled(fixedDelay = 60_000)
    void evictExpired() {
        long cutoff = System.currentTimeMillis() - WINDOW_MS;
        attempts.forEach((ip, deque) -> {
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst() < cutoff)
                    deque.pollFirst();
                if (deque.isEmpty()) attempts.remove(ip);
            }
        });
    }
}
