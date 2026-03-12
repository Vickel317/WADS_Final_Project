import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Academify API Documentation",
      version: "1.0.0",
      description:
        "API documentation for the Student Community & Collaboration Platform — COMP6703001",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // ── User ──────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx1234abc",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              example: "john@university.edu",
            },
            role: {
              type: "string",
              example: "user",
              enum: ["user", "moderator", "admin"],
            },
            bio: {
              type: "string",
              example: "Computer Science student passionate about ML.",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        // ── Post / Thread ─────────────────────────────────────
        Post: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "1",
            },
            title: {
              type: "string",
              example: "Best resources for learning React?",
            },
            content: {
              type: "string",
              example: "Looking for good React learning resources.",
            },
            category: {
              type: "string",
              example: "tech",
            },
            author: {
              type: "object",
              properties: {
                id: { type: "string", example: "user1" },
                name: { type: "string", example: "Alex Turner" },
              },
            },
            comments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  content: { type: "string" },
                  author: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                    },
                  },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
            fileUrl: {
              type: "string",
              example: "https://example.com/file.pdf",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        // ── File ──────────────────────────────────────────────
        File: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "1",
            },
            name: {
              type: "string",
              example: "Binary_Trees_Notes.pdf",
            },
            size: {
              type: "integer",
              example: 204800,
              description: "File size in bytes",
            },
            type: {
              type: "string",
              example: "application/pdf",
            },
            url: {
              type: "string",
              example: "/uploads/Binary_Trees_Notes.pdf",
            },
            uploadedBy: {
              type: "object",
              properties: {
                id: { type: "string", example: "user2" },
                name: { type: "string", example: "Sarah Chen" },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        // ── Message ───────────────────────────────────────────
        Message: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "1",
            },
            senderId: {
              type: "string",
              example: "user1",
            },
            receiverId: {
              type: "string",
              example: "current-user",
            },
            content: {
              type: "string",
              example: "Hey, want to study together?",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            read: {
              type: "boolean",
              example: false,
            },
          },
        },

        // ── Conversation ──────────────────────────────────────
        Conversation: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              example: "user1",
            },
            name: {
              type: "string",
              example: "Alex Turner",
            },
            lastMessage: {
              type: "string",
              example: "Hey, want to study together?",
            },
            lastAt: {
              type: "string",
              format: "date-time",
            },
            unread: {
              type: "integer",
              example: 2,
              description: "Number of unread messages",
            },
          },
        },

        // ── Event ─────────────────────────────────────────────
        Event: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "1",
            },
            title: {
              type: "string",
              example: "Machine Learning Study Group",
            },
            description: {
              type: "string",
              example: "Weekly ML study session for all levels.",
            },
            date: {
              type: "string",
              format: "date-time",
            },
            location: {
              type: "string",
              example: "Library Room 203",
            },
            organizer: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string", example: "John Doe" },
              },
            },
            attendees: {
              type: "integer",
              example: 8,
            },
          },
        },

        // ── Error ─────────────────────────────────────────────
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "An error occurred",
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    "./app/api/auth/**/*.ts",
    "./app/api/posts/**/*.ts",
    "./app/api/comments/**/*.ts",
    "./app/api/files/**/*.ts",
    "./app/api/messages/**/*.ts",
    "./app/api/events/**/*.ts",
    "./app/api/users/**/*.ts",
    "./app/api/categories/**/*.ts",
    "./app/api/reports/**/*.ts",
    "./app/api/moderation/**/*.ts",
    "./app/api/admin/**/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);