# 🚀 TeamWork API - Workspace & Collaboration Management Platform

A robust, enterprise-ready backend RESTful API built with **NestJS**, designed for team collaboration, workspace segregation, project planning, task tracking (Kanban board), and activity auditing.

## 🌟 Key Features

- **Authentication & Authorization**: Secure registration, login, and Role-Based Access Control (RBAC) supporting `OWNER`, `ADMIN`, and `MEMBER` roles.
- **Workspace Management**: Multi-tenant workspaces with unique membership mappings.
- **Project CRUD**: Nested inside workspaces, strictly scoped to member access levels.
- **Task & Kanban Board**: Task management nested within projects, grouped dynamically by states (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`).
- **Comments System**: Threaded comments on tasks with ownership checks (only comment creator can edit/delete).
- **Attachments (Cloud Storage)**: File attachment uploads integrated with **Multer** and **Cloudinary** (files stream directly from memory buffer without physical storage footprint).
- **Audit & Activity Logs**: Dynamic logging of system events (creates, updates, status movements, and deletions) for transparency.
- **Global Response & Exception Filters**: Consistent format for all API success payloads and HTTP errors.

---

## 🛠️ Tech Stack & Libraries

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL (relational storage)
- **Storage Service**: [Cloudinary](https://cloudinary.com/) (CDN for attachments and avatars)
- **Security & Auth**: Passport.js, JWT (JSON Web Tokens), bcrypt (password hashing)
- **Validation**: class-validator, class-transformer
- **File Upload**: Multer (using `memoryStorage`)

---

## 📊 Database Schema Design (Prisma)

The application models a collaborative team workspace environment:

- **User**: System accounts containing login details and user profiles (avatar supported).
- **Workspace**: Containers for work, containing members (via Membership) and Projects.
- **Membership**: Junction table mapping Users to Workspaces with specific Roles (`OWNER`, `ADMIN`, `MEMBER`).
- **Project**: Target units of work within a workspace.
- **Task**: To-do items inside a project with priority levels (`LOW`, `MEDIUM`, `HIGH`) and status states.
- **Comment**: Messages attached to tasks.
- **Attachment**: External files attached to tasks, referencing Cloudinary URLs.
- **Activity**: Audit logs tracking events per entity.

---

## 🛣️ API Route Map

All private endpoints require `Authorization: Bearer <JWT_TOKEN>`.

### 🔑 Authentication (`/auth`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Log in and receive JWT | No |

### 👤 Users (`/users`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Get current logged-in user profile | Yes |
| `PATCH` | `/users/avatar` | Upload/update profile avatar image | Yes |
| `PATCH` | `/users/:id` | Update user details | Yes |
| `DELETE` | `/users/:id` | Soft delete user account | Yes |

### 🏢 Workspaces (`/workspaces`)
| Method | Route | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/workspaces` | Create a new workspace | Yes | - |
| `GET` | `/workspaces` | List all workspaces current user belongs to | Yes | - |
| `GET` | `/workspaces/:id` | Get specific workspace details with members | Yes | - |
| `PATCH` | `/workspaces/:id` | Update workspace name/details | Yes | `OWNER`, `ADMIN` |
| `DELETE` | `/workspaces/:id` | Soft delete a workspace | Yes | `OWNER` |

### 👥 Workspace Memberships (`/workspaces/:workspaceId/members`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/workspaces/:workspaceId/members/invite` | Invite a user to a workspace by email | Yes (Owner/Admin) |
| `GET` | `/workspaces/:workspaceId/members` | List all members in the workspace | Yes |
| `DELETE` | `/workspaces/:workspaceId/members/:userId` | Remove a member from the workspace | Yes (Owner/Admin) |

### 📁 Projects (`/workspaces/:workspaceId/projects`)
| Method | Route | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/workspaces/:workspaceId/projects` | Create a new project | Yes | `OWNER`, `ADMIN` |
| `GET` | `/workspaces/:workspaceId/projects` | Get all projects in workspace | Yes | - |
| `GET` | `/workspaces/:workspaceId/projects/:id` | Get project details | Yes | - |
| `PATCH` | `/workspaces/:workspaceId/projects/:id` | Update project details | Yes | `OWNER`, `ADMIN` |
| `DELETE` | `/workspaces/:workspaceId/projects/:id` | Soft delete project | Yes | `OWNER`, `ADMIN` |

### 📝 Tasks (`/projects/:projectId/tasks`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/projects/:projectId/tasks` | Create a new task | Yes |
| `GET` | `/projects/:projectId/tasks` | Get all tasks of a project | Yes |
| `GET` | `/projects/:projectId/tasks/kanban` | Get tasks formatted & grouped for Kanban board | Yes |
| `GET` | `/projects/:projectId/tasks/:id` | Get task details | Yes |
| `PATCH` | `/projects/:projectId/tasks/:id` | Update task details (title, status, priority, etc.) | Yes |
| `DELETE` | `/projects/:projectId/tasks/:id` | Soft delete a task | Yes |

### 💬 Comments (`/tasks/:taskId/comments`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/tasks/:taskId/comments` | Add comment to a task | Yes |
| `GET` | `/tasks/:taskId/comments` | List all comments on a task | Yes |
| `PATCH` | `/tasks/:taskId/comments/:id` | Update comment (Owner only) | Yes |
| `DELETE` | `/tasks/:taskId/comments/:id` | Hard delete comment (Owner only) | Yes |

### 📎 Attachments (`/tasks/:taskId/attachments`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/tasks/:taskId/attachments` | Upload a file to task (Multer memory -> Cloudinary) | Yes |
| `GET` | `/tasks/:taskId/attachments` | List all attachments | Yes |
| `DELETE` | `/tasks/:taskId/attachments/:id` | Remove attachment from task and Cloudinary | Yes |

### 📜 Activity & Audit Logs (`/activity`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/activity/me` | Get audit logs for actions performed by current user | Yes |
| `GET` | `/activity/workspace/:workspaceId` | Get workspace audit trails | Yes |

---

## ⚙️ Standard Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "name": "General Workspace"
  },
  "timestamp": "2026-07-17T07:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Task not found",
  "path": "/projects/1/tasks/99",
  "timestamp": "2026-07-17T07:31:00.000Z"
}
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- **NodeJS** (v18+)
- **PostgreSQL** instance
- **Cloudinary** account (for file/avatar uploads)

### 2. Environment Configurations
Create a `.env` file in the root folder:
```env
PORT=3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/teamwork?schema=public"

# Authentication
JWT_SECRET="YOUR_SUPER_SECRET_KEY"
JWT_EXPIRATION="7d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Database Migrations
```bash
npx prisma migrate dev
```

### 5. Running the Application
```bash
# Development mode
npm run start:dev

# Production build & run
npm run build
npm run start:prod
```
