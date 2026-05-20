package com.busmanagement.service;

import com.busmanagement.entity.Ticket;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendBookingConfirmation(Ticket ticket) {
        if (fromEmail == null || fromEmail.isBlank()) return;

        String toEmail = ticket.getCustomer().getEmail();
        if (toEmail == null || toEmail.isBlank()) return;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Xác nhận đặt vé #" + ticket.getBookingCode() + " - BusGo");
            helper.setText(buildHtml(ticket), true);
            mailSender.send(message);
            log.info("Email xác nhận đã gửi tới {}", toEmail);
        } catch (Exception e) {
            log.warn("Không thể gửi email xác nhận: {}", e.getMessage());
        }
    }

    public void sendCancellationNotification(Ticket ticket) {
        if (fromEmail == null || fromEmail.isBlank()) return;
        String toEmail = ticket.getCustomer().getEmail();
        if (toEmail == null || toEmail.isBlank()) return;

        try {
            var route = ticket.getVehicleRoute().getRoute();
            var vr = ticket.getVehicleRoute();
            String departure = vr.getDepartureTime() != null
                    ? vr.getDepartureTime().format(DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy")) : "—";

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Xác nhận hủy vé #" + ticket.getBookingCode() + " - BusGo");
            helper.setText("""
                    <!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/></head>
                    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
                        <tr><td align="center">
                          <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                            <tr><td style="background:#ef4444;padding:28px 40px;text-align:center;">
                              <div style="font-size:26px;font-weight:800;color:#fff;">🚌 BusGo</div>
                              <div style="color:#fecaca;font-size:13px;margin-top:4px;">Thông báo hủy vé</div>
                            </td></tr>
                            <tr><td style="padding:28px 40px 0;text-align:center;">
                              <div style="font-size:20px;font-weight:700;color:#1e1b4b;">Vé đã được hủy thành công</div>
                              <div style="font-size:13px;color:#6b7280;margin-top:6px;">Chúng tôi đã ghi nhận yêu cầu hủy vé của bạn</div>
                            </td></tr>
                            <tr><td style="padding:20px 40px;">
                              <div style="background:#fef2f2;border:2px dashed #fca5a5;border-radius:10px;padding:16px;text-align:center;">
                                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Mã vé đã hủy</div>
                                <div style="font-size:28px;font-weight:800;color:#ef4444;letter-spacing:4px;text-decoration:line-through;">%s</div>
                              </div>
                            </td></tr>
                            <tr><td style="padding:0 40px 28px;">
                              <table width="100%%" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                                <tr style="background:#f9fafb;"><td style="padding:11px 16px;font-size:12px;color:#6b7280;width:130px;">Tuyến đường</td><td style="padding:11px 16px;font-size:13px;font-weight:600;color:#111827;">%s → %s</td></tr>
                                <tr><td style="padding:11px 16px;font-size:12px;color:#6b7280;">Giờ khởi hành</td><td style="padding:11px 16px;font-size:13px;font-weight:600;">%s</td></tr>
                                <tr style="background:#f9fafb;"><td style="padding:11px 16px;font-size:12px;color:#6b7280;">Ghế</td><td style="padding:11px 16px;font-size:13px;font-weight:600;">Ghế số %d</td></tr>
                              </table>
                            </td></tr>
                            <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                              <div style="font-size:12px;color:#9ca3af;">Nếu bạn không thực hiện hủy vé này, vui lòng liên hệ hỗ trợ ngay.</div>
                              <div style="font-size:11px;color:#d1d5db;margin-top:8px;">© 2025 BusGo · Email này được gửi tự động, vui lòng không trả lời.</div>
                            </td></tr>
                          </table>
                        </td></tr>
                      </table>
                    </body></html>
                    """.formatted(ticket.getBookingCode(), route.getOrigin(), route.getDestination(),
                    departure, ticket.getSeatNumber()), true);
            mailSender.send(message);
            log.info("Email hủy vé đã gửi tới {}", toEmail);
        } catch (Exception e) {
            log.warn("Không thể gửi email hủy vé: {}", e.getMessage());
        }
    }

    private String buildHtml(Ticket ticket) {
        var route = ticket.getVehicleRoute().getRoute();
        var vr = ticket.getVehicleRoute();
        String departure = vr.getDepartureTime() != null
                ? vr.getDepartureTime().format(DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy"))
                : "—";
        String price = route.getBasePrice() != null
                ? String.format("%,.0f₫", route.getBasePrice())
                : "—";
        String company = vr.getVehicle().getBusCompany().getCompanyName();

        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="UTF-8"/></head>
                <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
                    <tr><td align="center">
                      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <tr><td style="background:#4f46e5;padding:28px 40px;text-align:center;">
                          <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">🚌 BusGo</div>
                          <div style="color:#c7d2fe;font-size:13px;margin-top:4px;">Hệ thống đặt vé xe khách</div>
                        </td></tr>

                        <!-- Title -->
                        <tr><td style="padding:28px 40px 0;text-align:center;">
                          <div style="font-size:20px;font-weight:700;color:#1e1b4b;">Đặt vé thành công!</div>
                          <div style="font-size:13px;color:#6b7280;margin-top:6px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi</div>
                        </td></tr>

                        <!-- Booking code -->
                        <tr><td style="padding:20px 40px;">
                          <div style="background:#f5f3ff;border:2px dashed #818cf8;border-radius:10px;padding:16px;text-align:center;">
                            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Mã đặt vé</div>
                            <div style="font-size:28px;font-weight:800;color:#4f46e5;letter-spacing:4px;">%s</div>
                            <div style="font-size:11px;color:#9ca3af;margin-top:6px;">Xuất trình mã này khi lên xe</div>
                          </div>
                        </td></tr>

                        <!-- Ticket details -->
                        <tr><td style="padding:0 40px 24px;">
                          <table width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                            %s
                          </table>
                        </td></tr>

                        <!-- Footer -->
                        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                          <div style="font-size:12px;color:#9ca3af;">Nếu bạn cần hỗ trợ, vui lòng liên hệ nhà xe <strong>%s</strong></div>
                          <div style="font-size:11px;color:#d1d5db;margin-top:8px;">© 2025 BusGo · Email này được gửi tự động, vui lòng không trả lời.</div>
                        </td></tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                ticket.getBookingCode(),
                buildRows(route.getOrigin() + " → " + route.getDestination(),
                        route.getName(), departure,
                        "Ghế số " + ticket.getSeatNumber(),
                        vr.getVehicle().getModel() + " (" + vr.getVehicle().getLicensePlate() + ")",
                        price, company),
                company
        );
    }

    private String buildRows(String route, String routeName, String departure,
                             String seat, String vehicle, String price, String company) {
        return row("Tuyến đường", route, true)
                + row("Tên tuyến", routeName, false)
                + row("Giờ khởi hành", departure, true)
                + row("Ghế", seat, false)
                + row("Xe", vehicle, true)
                + row("Nhà xe", company, false)
                + row("Giá vé", "<strong style=\"color:#f97316;\">" + price + "</strong>", true);
    }

    private String row(String label, String value, boolean shaded) {
        String bg = shaded ? "#f9fafb" : "#fff";
        return """
                <tr style="background:%s;">
                  <td style="padding:11px 16px;font-size:12px;color:#6b7280;width:130px;border-bottom:1px solid #f3f4f6;">%s</td>
                  <td style="padding:11px 16px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">%s</td>
                </tr>
                """.formatted(bg, label, value);
    }
}
