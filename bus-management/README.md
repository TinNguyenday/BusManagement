# Bus Management System - Backend

Hệ thống quản lý nhà xe với 3 role: **Admin**, **Staff (nhân viên)**, **Owner (nhà xe)**.

## 🛠️ Công nghệ

- Java 17
- Spring Boot 3.3.0
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Lombok

## 📋 Yêu cầu cài đặt

1. **JDK 17** trở lên
2. **Maven 3.8+**
3. **PostgreSQL 14+**
4. **IDE**: IntelliJ IDEA hoặc VS Code (với Extension Pack for Java)

## 🚀 Hướng dẫn chạy

### Bước 1: Tạo database

Mở PostgreSQL (pgAdmin hoặc psql) và chạy:

```sql
CREATE DATABASE bus_management;
```

### Bước 2: Cấu hình kết nối database

Mở file `src/main/resources/application.yml`, sửa username/password nếu cần:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/bus_management
    username: postgres       # đổi nếu khác
    password: postgres       # đổi nếu khác
```

### Bước 3: Build và chạy

Mở terminal tại thư mục gốc project:

```bash
# Trên Windows
mvnw.cmd spring-boot:run

# Trên Mac/Linux
./mvnw spring-boot:run
```

Hoặc mở bằng IntelliJ/VS Code và chạy `BusManagementApplication.java`.

Server sẽ chạy ở: **http://localhost:8080**

### Bước 4: Tài khoản admin mặc định

Hệ thống tự tạo sẵn:
- Username: `admin`
- Password: `admin123`

---

## 📡 API Endpoints

### 🔐 Auth (public)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký nhà xe (role OWNER) |
| POST | `/api/auth/login` | Đăng nhập cả 3 role |

**Body đăng ký:**
```json
{
  "username": "nhaxe1",
  "email": "nhaxe1@gmail.com",
  "password": "123456",
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567",
  "companyName": "Nhà xe Phương Trang",
  "address": "123 Lê Lợi, Q1, HCM",
  "idCardNumber": "012345678901",
  "bankAccountNumber": "19036789012345",
  "bankName": "Vietcombank"
}
```

**Body login:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### 👨‍💼 Admin (cần JWT role ADMIN)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/bus-companies?status=PENDING` | Danh sách nhà xe (lọc theo status) |
| GET | `/api/admin/bus-companies/{id}` | Chi tiết 1 nhà xe |
| PUT | `/api/admin/bus-companies/{id}/approve` | Duyệt |
| PUT | `/api/admin/bus-companies/{id}/reject` | Từ chối |
| GET | `/api/admin/bus-companies/{id}/overview` | Dashboard xe + tài xế của nhà xe |

### 👷 Staff (cần JWT role STAFF)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/routes` | Danh sách tuyến |
| POST | `/api/routes` | Tạo tuyến mới |
| PUT | `/api/routes/{id}` | Sửa tuyến |
| DELETE | `/api/routes/{id}` | Xoá tuyến |

**Body tạo tuyến:**
```json
{
  "name": "HCM - Đà Lạt",
  "origin": "Hồ Chí Minh",
  "destination": "Đà Lạt",
  "distanceKm": 310,
  "estimatedDurationMin": 420,
  "basePrice": 250000
}
```

### 🚌 Owner (cần JWT role OWNER + đã được duyệt)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/owner/my-company` | Xem thông tin công ty |
| GET | `/api/owner/vehicles` | Danh sách xe |
| POST | `/api/owner/vehicles` | Nhập xe mới |
| DELETE | `/api/owner/vehicles/{id}` | Xoá xe |
| GET | `/api/owner/drivers` | Danh sách tài xế |
| POST | `/api/owner/drivers` | Nhập tài xế mới |
| DELETE | `/api/owner/drivers/{id}` | Xoá tài xế |
| GET | `/api/owner/assignments` | Xem lịch phân công |
| POST | `/api/owner/assignments` | Phân công xe + tài xế + tuyến |
| DELETE | `/api/owner/assignments/{id}` | Huỷ phân công |

**Body nhập xe:**
```json
{
  "licensePlate": "51A-12345",
  "model": "Thaco 45 chỗ",
  "seatCount": 45,
  "vehicleType": "Giường nằm"
}
```

**Body nhập tài xế:**
```json
{
  "fullName": "Trần Văn B",
  "phone": "0912345678",
  "idCardNumber": "098765432109",
  "licenseNumber": "D123456789",
  "licenseClass": "D",
  "licenseExpiry": "2030-12-31"
}
```

**Body phân công:**
```json
{
  "vehicleId": 1,
  "driverId": 1,
  "routeId": 1,
  "departureTime": "2026-05-01T08:00:00"
}
```

---

## 🔑 Cách gọi API với JWT

Sau khi login thành công, bạn nhận được `token`. Dùng token này trong header:

```
Authorization: Bearer <token>
```

Ví dụ với curl:
```bash
curl -H "Authorization: Bearer eyJhbG..." http://localhost:8080/api/owner/vehicles
```

---

## 🧪 Test luồng đầy đủ

### 1. Admin đăng nhập
```
POST /api/auth/login
{ "username": "admin", "password": "admin123" }
```

### 2. Nhà xe đăng ký
```
POST /api/auth/register
(body như ví dụ ở trên)
```
→ Trả về thông tin, nhưng chưa có token vì đang chờ duyệt.

### 3. Nhà xe thử login → bị chặn
```
POST /api/auth/login
{ "username": "nhaxe1", "password": "123456" }
```
→ 403 "Tài khoản đang chờ admin duyệt"

### 4. Admin duyệt
```
GET /api/admin/bus-companies?status=PENDING     (lấy danh sách chờ duyệt)
PUT /api/admin/bus-companies/{id}/approve       (duyệt)
```

### 5. Nhà xe login lại → OK
```
POST /api/auth/login
```
→ 200 OK với token.

### 6. Nhà xe nhập xe + tài xế
```
POST /api/owner/vehicles
POST /api/owner/drivers
```

### 7. Tạo tài khoản staff (chưa có, cần tạo thủ công trong DB hoặc dùng admin tạo)

Hiện tại bạn có thể thêm tài khoản staff thủ công bằng SQL:

```sql
INSERT INTO users (username, email, password_hash, full_name, phone, role_id, status, auth_provider, created_at)
VALUES (
  'staff1',
  'staff1@bus.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Nhân viên 1',
  '0900000001',
  2,       -- role STAFF
  'ACTIVE',
  'LOCAL',
  NOW()
);
```
Password cũng là `admin123`.

### 8. Staff tạo tuyến
```
POST /api/routes
```

### 9. Nhà xe phân công
```
POST /api/owner/assignments
```

---

## 🐛 Troubleshooting

**Lỗi "Could not connect to database":**
- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra username/password trong `application.yml`

**Lỗi "Port 8080 already in use":**
- Đổi port trong `application.yml`: `server.port: 8081`

**Lỗi 403 khi gọi API:**
- Kiểm tra token còn hạn không (mặc định 24h)
- Kiểm tra role có đúng không

---

## 📂 Cấu trúc project

```
bus-management/
├── pom.xml
├── src/main/
│   ├── java/com/busmanagement/
│   │   ├── BusManagementApplication.java
│   │   ├── config/        # Security, JWT, CORS
│   │   ├── controller/    # REST endpoints
│   │   ├── dto/           # Request/Response objects
│   │   ├── entity/        # JPA entities
│   │   ├── exception/     # Global exception handler
│   │   ├── repository/    # Spring Data JPA
│   │   └── service/       # Business logic
│   └── resources/
│       ├── application.yml
│       └── data.sql
```
