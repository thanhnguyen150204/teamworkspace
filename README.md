# 🚀 TeamWork API - Enterprise NestJS Backend & Collaboration Platform

Một ứng dụng Backend RESTful API hoàn chỉnh xây dựng trên nền tảng **NestJS**, thiết kế theo tiêu chuẩn doanh nghiệp cho quản lý không gian làm việc (Workspaces), dự án (Projects), công việc (Tasks Kanban Board), bình luận (Comments), tệp đính kèm (Cloudinary Attachments) và nhật ký hoạt động (Audit Logs).

Tài liệu này được biên soạn chi tiết từng bước từ khởi tạo dự án, thiết lập cơ sở dữ liệu **PostgreSQL + Prisma ORM**, quản lý biến môi trường an toàn, đến đóng gói và triển khai ứng dụng bằng **Docker & Docker Compose** kèm tự động chạy Migration.

---

## 📋 Mục lục

1. [🏛️ Cấu trúc Thư mục Chuẩn NestJS](#-cấu-trúc-thư-mục-chuẩn-nestjs)
2. [⚙️ Quản lý Biến Môi trường (Environment Setup & Validation)](#️-quản-lý-biến-môi-trường-environment-setup--validation)
3. [🗄️ Thiết lập PostgreSQL & Prisma ORM từ Đầu](#️-thiết-lập-postgresql--prisma-orm-từ-đầu)
4. [🐳 Hướng dẫn Triển khai Docker & Docker Compose (Auto Migration)](#-hướng-dẫn-triển-khai-docker--docker-compose-auto-migration)
5. [🛣️ Chi tiết Hệ thống API Endpoints](#️-chi-tiết-hệ-thống-api-endpoints)
6. [🛡️ Kiến trúc Phân quyền (Service-Based Authorization)](#️-kiến-trúc-phân-quyền-service-based-authorization)
7. [🧪 Chạy Test & Kiểm thử Hệ thống](#-chạy-test--kiểm-thử-hệ-thống)

---

## 🏛️ Cấu trúc Thư mục Chuẩn NestJS

Ứng dụng tuân theo mô-đun hóa (Modular Architecture) giúp mở rộng dễ dàng và bảo trì cao:

```text
backend/
├── prisma/
│   ├── schema.prisma           # Định nghĩa Database Models & Entity Relations
│   └── migrations/             # Lịch sử các bản migration cơ sở dữ liệu
├── src/
│   ├── activity/               # Audit Logs module (Nhật ký hoạt động hệ thống)
│   ├── attachments/            # File upload module (Tệp đính kèm tích hợp Cloudinary)
│   ├── auth/                   # Authentication & Authorization (JWT, Refresh Token, Passport Strategies)
│   │   ├── decorators/         # Custom Decorators (@CurrentUser, @Roles)
│   │   ├── dto/                # Data Transfer Objects (LoginDto, RegisterDto, RefreshTokenDto)
│   │   ├── guards/             # Authentication & Authorization Guards (JwtAuthGuard, WorkspaceRolesGuard)
│   │   └── strategies/         # Passport Strategies (JwtStrategy)
│   ├── comments/               # Task Comments module
│   ├── common/                 # Shared Components (Filters, Interceptors, Middleware, Cloudinary Service)
│   │   ├── filters/            # Global Exception Filters (HttpExceptionFilter)
│   │   ├── interceptors/       # Global Response Interceptors (ResponseInterceptor)
│   │   └── middleware/         # Logging Middleware
│   ├── config/                 # Centralized Domain Configs & Environment Validation
│   │   ├── app.config.ts       # App level configurations (Port, Environment)
│   │   ├── auth.config.ts      # Auth & JWT configurations
│   │   ├── cloudinary.config.ts# Cloudinary CDN credentials
│   │   ├── database.config.ts  # Database connection configuration
│   │   └── env.validation.ts   # Joi Schema validation cho biến môi trường
│   ├── memberships/            # Workspace Membership Management & Invites
│   ├── prisma/                 # Prisma Module & Prisma Service injection wrapper
│   ├── projects/               # Project Management module
│   ├── tasks/                  # Task & Kanban Board module
│   ├── users/                  # User Profile Management module
│   ├── workspaces/             # Multi-tenant Workspace module & WorkspaceAccessService
│   ├── app.module.ts           # Root Module chứa cấu hình ứng dụng
│   └── main.ts                 # Entrypoint khởi chạy ứng dụng NestJS
├── .env                        # File biến môi trường (KHÔNG COMMIT LÊN GIT)
├── .env.example                # File mẫu biến môi trường
├── docker-compose.yml          # Docker Compose orchestration (PostgreSQL + NestJS API)
├── Dockerfile                  # Multi-stage Docker build file
├── package.json                # Dependencies & scripts
└── README.md                   # Tài liệu hướng dẫn dự án
```

---

## ⚙️ Quản lý Biến Môi trường (Environment Setup & Validation)

Ứng dụng sử dụng `@nestjs/config` kết hợp với `Joi` schema validation để đảm bảo **server ngắt khởi động ngay lập tức (Fail Startup)** nếu thiếu bất kỳ cấu hình quan trọng nào.

### 1. Danh sách các biến môi trường bắt buộc

| Tên biến | Mô tả | Giá trị mẫu / Đơn vị |
| :--- | :--- | :--- |
| `PORT` | Cổng HTTP Server lắng nghe | `3000` |
| `NODE_ENV` | Môi trường ứng dụng | `development` / `production` |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL | `postgresql://postgres:postgres_password@localhost:5432/teamwork_db?schema=public` |
| `POSTGRES_USER` | Username của PostgreSQL container | `postgres` |
| `POSTGRES_PASSWORD` | Password của PostgreSQL container | `postgres_password` |
| `POSTGRES_DB` | Tên Database PostgreSQL | `teamwork_db` |
| `DATABASE_PORT` | Cổng map cho PostgreSQL trên Host | `5432` |
| `JWT_SECRET` | Khóa bí mật ký Access Token JWT | `super_secret_access_jwt_key` |
| `JWT_EXPIRATION` | Thời gian hết hạn Access Token | `15m` (15 phút) |
| `REFRESH_TOKEN_SECRET` | Khóa bí mật ký Refresh Token JWT | `super_secret_refresh_jwt_key` |
| `REFRESH_TOKEN_EXPIRATION` | Thời gian hết hạn Refresh Token | `7d` (7 ngày) |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name trên Cloudinary Dashboard | `my_cloud_name` |
| `CLOUDINARY_API_KEY` | API Key của Cloudinary | `1234567890` |
| `CLOUDINARY_API_SECRET` | API Secret của Cloudinary | `abcdefghijklmnopqrstuvwxyz` |

### 2. Thiết lập file `.env` từ file mẫu

Chạy lệnh tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

---

## 🗄️ Thiết lập PostgreSQL & Prisma ORM từ Đầu

Dưới đây là các bước để tự thiết lập Prisma ORM với PostgreSQL cho một dự án NestJS mới:

### 1. Cài đặt Prisma CLI & Prisma Client

```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Khởi tạo Prisma trong dự án

```bash
npx prisma init
```
Lệnh này sẽ tạo thư mục `prisma/schema.prisma` và file `.env`.

### 3. Khai báo Datasource trong `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### 4. Tạo các bản Migration (Database Migrations)

Mỗi khi bạn thay đổi các model trong `schema.prisma`, hãy chạy lệnh sau để tạo và áp dụng migration vào cơ sở dữ liệu:

```bash
# Tạo bản migration mới cho môi trường phát triển (Development)
npx prisma migrate dev --name init_schema

# Sinh lại Prisma Client types
npx prisma generate
```

### 5. Xem dữ liệu bằng Prisma Studio (GUI)

```bash
npx prisma studio
```
Trình duyệt sẽ mở tại địa chỉ `http://localhost:5555` giúp bạn quản lý trực quan dữ liệu trong PostgreSQL.

---

## 🐳 Hướng dẫn Triển khai Docker & Docker Compose (Auto Migration)

Dự án cung cấp sẵn cấu hình **Dockerfile multi-stage** giúp giảm dung lượng image và **docker-compose.yml** tự động quản lý kết nối PostgreSQL + tự động chạy `npx prisma migrate deploy` khi ứng dụng khởi chạy.

### 1. Kiến trúc Docker Multi-Stage (`Dockerfile`)

Dockerfile được chia làm 2 giai đoạn:
- **Stage 1 (Builder)**: Cài đặt đủ dependencies, generate Prisma Client và biên dịch TypeScript thành JavaScript (`dist/`).
- **Stage 2 (Runner)**: Chỉ giữ lại sản phẩm đã build và dependencies cần thiết, chạy ứng dụng dưới container tối ưu nhẹ.

### 2. Triển khai toàn bộ hệ thống bằng Docker Compose

Chỉ cần một lệnh duy nhất để khởi tạo PostgreSQL Container, đợi DB sẵn sàng (Healthcheck) và tự động apply Migration cho Backend API:

```bash
# Khởi chạy tất cả các services ở chế độ background (detached mode)
docker compose up -d --build
```

### 3. Kiểm tra trạng thái & Log của Container

```bash
# Xem danh sách các container đang chạy
docker compose ps

# Xem log trực tiếp của backend API
docker compose logs -f api

# Xem log trực tiếp của PostgreSQL
docker compose logs -f postgres
```

### 4. Dừng và dọn dẹp Containers

```bash
# Dừng các container
docker compose down

# Dừng và xóa toàn bộ dữ liệu database volume (NẾU CẦN RESET DATABASE)
docker compose down -v
```

---

## 🛣️ Chi tiết Hệ thống API Endpoints

Tất cả các API yêu cầu xác thực bắt buộc truyền Header:  
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

### 🔑 Authentication (`/auth`)
- `POST /auth/register` - Đăng ký tài khoản mới.
- `POST /auth/login` - Đăng nhập nhận `accessToken` và `refreshToken`.
- `POST /auth/refresh` - Làm mới Access Token khi hết hạn.

### 👤 Users (`/users`)
- `GET /users/me` - Lấy thông tin tài khoản hiện tại.
- `PATCH /users/avatar` - Cập nhật ảnh đại diện (Tải lên Cloudinary).
- `PATCH /users/:id` - Cập nhật thông tin người dùng.
- `DELETE /users/:id` - Xóa mềm tài khoản.

### 🏢 Workspaces (`/workspaces`)
- `POST /workspaces` - Tạo workspace mới (Người tạo tự động thành `OWNER`).
- `GET /workspaces` - Danh sách workspace người dùng tham gia.
- `GET /workspaces/:id` - Thông tin chi tiết workspace và danh sách thành viên.
- `PATCH /workspaces/:id` - Cập nhật thông tin workspace (`OWNER`, `ADMIN`).
- `DELETE /workspaces/:id` - Xóa mềm workspace (`OWNER`).

### 👥 Memberships (`/workspaces/:workspaceId/members`)
- `POST /workspaces/:workspaceId/members` - Mời thành viên mới vào workspace bằng Email.
- `GET /workspaces/:workspaceId/members` - Xem danh sách thành viên.
- `PATCH /workspaces/:workspaceId/members/:userId` - Thay đổi quyền/vai trò thành viên (`OWNER`).
- `DELETE /workspaces/:workspaceId/members/:userId` - Xóa thành viên khỏi workspace (`OWNER`).

### 📁 Projects (`/workspaces/:workspaceId/projects`)
- `POST /workspaces/:workspaceId/projects` - Tạo dự án mới trong workspace (`OWNER`, `ADMIN`).
- `GET /workspaces/:workspaceId/projects` - Danh sách dự án trong workspace.
- `GET /workspaces/:workspaceId/projects/:id` - Thông tin chi tiết dự án.
- `PATCH /workspaces/:workspaceId/projects/:id` - Cập nhật dự án (`OWNER`, `ADMIN`).
- `DELETE /workspaces/:workspaceId/projects/:id` - Xóa mềm dự án (`OWNER`, `ADMIN`).

### 📝 Tasks Kanban (`/projects/:projectId/tasks`)
- `POST /projects/:projectId/tasks` - Tạo công việc mới.
- `GET /projects/:projectId/tasks` - Danh sách công việc.
- `GET /projects/:projectId/tasks/kanban` - Lấy công việc phân nhóm theo trạng thái Kanban (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`).
- `GET /projects/:projectId/tasks/:id` - Chi tiết công việc.
- `PATCH /projects/:projectId/tasks/:id` - Cập nhật trạng thái/tiến độ công việc.
- `DELETE /projects/:projectId/tasks/:id` - Xóa mềm công việc.

### 💬 Comments (`/tasks/:taskId/comments`)
- `POST /tasks/:taskId/comments` - Thêm bình luận vào công việc.
- `GET /tasks/:taskId/comments` - Danh sách bình luận của công việc.
- `PATCH /tasks/:taskId/comments/:id` - Chỉnh sửa bình luận (Chỉ chủ sở hữu).
- `DELETE /tasks/:taskId/comments/:id` - Xóa bình luận (Chỉ chủ sở hữu).

### 📎 Attachments (`/tasks/:taskId/attachments`)
- `POST /tasks/:taskId/attachments` - Upload tệp đính kèm (Stream trực tiếp từ RAM sang Cloudinary CDN).
- `GET /tasks/:taskId/attachments` - Danh sách tệp đính kèm.
- `DELETE /tasks/:taskId/attachments/:id` - Xóa tệp đính kèm trên DB và Cloudinary.

### 📜 Activity & Audit Logs (`/activity`)
- `GET /activity/me` - Lịch sử hoạt động của cá nhân.
- `GET /activity/workspace/:workspaceId` - Nhật ký kiểm toán toàn bộ hoạt động trong Workspace.

---

## 🛡️ Kiến trúc Phân quyền (Service-Based Authorization)

Dự án áp dụng **Service-Based Authorization** tập trung tại `WorkspaceAccessService` ([workspace-access.service.ts](file:///d:/team-work-space/backend/src/workspaces/workspace-access.service.ts)) nhằm tránh phụ thuộc vào hình dạng của đường dẫn HTTP (Route Shape):

- `requireWorkspaceMember(userId, workspaceId)`: Xác thực người dùng có thuộc Workspace hay không.
- `requireWorkspaceRole(userId, workspaceId, requiredRoles)`: Kiểm tra vai trò tối thiểu (`OWNER`, `ADMIN`).
- `requireProjectMember(userId, projectId)`: Xác thực quyền truy cập dự án thông qua Workspace Membership.
- `requireTaskMember(userId, taskId)`: Xác thực quyền truy cập task thông qua lồng dự án & workspace.

---

## 🧪 Chạy Test & Kiểm thử Hệ thống

```bash
# Chạy tất cả các unit tests
npm test

# Chạy test ở chế độ theo dõi (Watch mode)
npm run test:watch

# Kiểm tra độ phủ code test (Coverage report)
npm run test:cov
```

---

## 💡 Quy trình Tạo Dự án NestJS mới từ Đầu (Quick Reference)

Để tạo một dự án tương tự từ con số 0:

1. **Tạo NestJS Core**:
   ```bash
   npx @nestjs/cli new backend --strict
   ```
2. **Cài đặt các thư viện lõi**:
   ```bash
   npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer joi @prisma/client cloudinary multer
   npm install -D prisma @types/bcrypt @types/passport-jwt @types/multer
   ```
3. **Khởi tạo Prisma & Docker Compose**:
   ```bash
   npx prisma init
   ```
4. **Viết schema, cấu hình `.env`, chạy migration & code modules**.
