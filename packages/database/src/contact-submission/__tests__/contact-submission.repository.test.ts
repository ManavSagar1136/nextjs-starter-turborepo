import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createContactSubmission } from "../create-contact-submission";
import {
  getContactSubmissionById,
  getContactSubmissionsByEmail,
  getUnreadContactSubmissionsCount,
} from "../get-contact-submission";
import {
  updateContactSubmission,
  markContactSubmissionRead,
  markContactSubmissionReplied,
  archiveContactSubmission,
  markContactSubmissionSpam,
  assignContactSubmission,
  unassignContactSubmission,
  archiveOldContactSubmissions,
  deleteContactSubmission,
  deleteSpamContactSubmissions,
} from "../update-contact-submission";
import {
  listContactSubmissions,
  getContactSubmissionStats,
  getContactSubmissionCategories,
} from "../list-contact-submissions";
import type { PrismaClient, ContactSubmission } from "@prisma/client";

// Mock prisma client
const mockPrisma = {
  contactSubmission: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe("Contact Submission Repository", () => {
  const mockSubmissionId = "contact-123";
  const mockEmail = "user@example.com";
  const mockWorkspaceId = "workspace-456";
  const mockUserId = "user-789";

  const mockSubmission: ContactSubmission = {
    id: mockSubmissionId,
    email: mockEmail,
    firstName: "John",
    lastName: "Doe",
    phone: "+1234567890",
    company: "Acme Inc",
    subject: "General Inquiry",
    message: "I would like to know more about your services.",
    category: "inquiry",
    priority: "normal",
    status: "NEW",
    source: "website",
    sourceIp: "192.168.1.1",
    referrer: "https://google.com",
    pageUrl: "/contact",
    utmSource: "google",
    utmMedium: "organic",
    utmCampaign: null,
    workspaceId: mockWorkspaceId,
    assignedTo: null,
    readAt: null,
    repliedAt: null,
    archivedAt: null,
    replyContent: null,
    metadata: null,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createContactSubmission", () => {
    it("should create a new contact submission", async () => {
      vi.mocked(mockPrisma.contactSubmission.create).mockResolvedValue(mockSubmission);

      const result = await createContactSubmission(mockPrisma, {
        email: "  USER@example.com  ",
        firstName: "John",
        lastName: "Doe",
        message: "Hello!",
      });

      expect(mockPrisma.contactSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          message: "Hello!",
          status: "NEW",
          priority: "normal",
        }),
      });
      expect(result).toEqual(mockSubmission);
    });

    it("should normalize email to lowercase", async () => {
      vi.mocked(mockPrisma.contactSubmission.create).mockResolvedValue(mockSubmission);

      await createContactSubmission(mockPrisma, {
        email: "  TEST@EXAMPLE.COM  ",
        message: "Test message",
      });

      expect(mockPrisma.contactSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "test@example.com",
        }),
      });
    });

    it("should create submission with all optional fields", async () => {
      vi.mocked(mockPrisma.contactSubmission.create).mockResolvedValue(mockSubmission);

      await createContactSubmission(mockPrisma, {
        email: mockEmail,
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
        company: "Acme Inc",
        subject: "Support Request",
        message: "Need help",
        category: "support",
        priority: "high",
        source: "website",
        sourceIp: "192.168.1.1",
        referrer: "https://google.com",
        pageUrl: "/contact",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "launch",
        workspaceId: mockWorkspaceId,
        metadata: { customField: "value" },
      });

      expect(mockPrisma.contactSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: "John",
          lastName: "Doe",
          phone: "+1234567890",
          company: "Acme Inc",
          subject: "Support Request",
          category: "support",
          priority: "high",
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "launch",
          workspaceId: mockWorkspaceId,
          metadata: { customField: "value" },
        }),
      });
    });

    it("should default priority to normal when not provided", async () => {
      vi.mocked(mockPrisma.contactSubmission.create).mockResolvedValue(mockSubmission);

      await createContactSubmission(mockPrisma, {
        email: mockEmail,
        message: "Test",
      });

      expect(mockPrisma.contactSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: "normal",
        }),
      });
    });
  });

  describe("getContactSubmissionById", () => {
    it("should return submission when found", async () => {
      vi.mocked(mockPrisma.contactSubmission.findUnique).mockResolvedValue(mockSubmission);

      const result = await getContactSubmissionById(mockPrisma, mockSubmissionId);

      expect(mockPrisma.contactSubmission.findUnique).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
      });
      expect(result).toEqual(mockSubmission);
    });

    it("should return null when not found", async () => {
      vi.mocked(mockPrisma.contactSubmission.findUnique).mockResolvedValue(null);

      const result = await getContactSubmissionById(mockPrisma, "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getContactSubmissionsByEmail", () => {
    it("should return submissions by email with default limit", async () => {
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([mockSubmission]);

      const result = await getContactSubmissionsByEmail(mockPrisma, mockEmail);

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith({
        where: { email: mockEmail },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      expect(result).toEqual([mockSubmission]);
    });

    it("should normalize email and respect custom limit", async () => {
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([]);

      await getContactSubmissionsByEmail(mockPrisma, "  TEST@EXAMPLE.COM  ", 5);

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    });
  });

  describe("getUnreadContactSubmissionsCount", () => {
    it("should return count of NEW submissions", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(15);

      const result = await getUnreadContactSubmissionsCount(mockPrisma);

      expect(mockPrisma.contactSubmission.count).toHaveBeenCalledWith({
        where: { status: "NEW" },
      });
      expect(result).toBe(15);
    });

    it("should filter by workspace when provided", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(5);

      await getUnreadContactSubmissionsCount(mockPrisma, mockWorkspaceId);

      expect(mockPrisma.contactSubmission.count).toHaveBeenCalledWith({
        where: { status: "NEW", workspaceId: mockWorkspaceId },
      });
    });
  });

  describe("updateContactSubmission", () => {
    it("should update submission fields", async () => {
      const updatedSubmission = { ...mockSubmission, category: "support", priority: "high" };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue(updatedSubmission);

      const result = await updateContactSubmission(mockPrisma, mockSubmissionId, {
        category: "support",
        priority: "high",
      });

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: expect.objectContaining({
          category: "support",
          priority: "high",
        }),
      });
      expect(result.category).toBe("support");
    });

    it("should update submission with metadata", async () => {
      const metadata = { notes: "Follow up required" };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue({
        ...mockSubmission,
        metadata,
      });

      await updateContactSubmission(mockPrisma, mockSubmissionId, { metadata });

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: expect.objectContaining({ metadata }),
      });
    });
  });

  describe("markContactSubmissionRead", () => {
    it("should mark submission as read with timestamp", async () => {
      const readSubmission = {
        ...mockSubmission,
        status: "READ" as const,
        readAt: new Date(),
      };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue(readSubmission);

      const result = await markContactSubmissionRead(mockPrisma, mockSubmissionId);

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: {
          status: "READ",
          readAt: expect.any(Date),
        },
      });
      expect(result.status).toBe("READ");
    });
  });

  describe("markContactSubmissionReplied", () => {
    it("should mark submission as replied without content", async () => {
      const repliedSubmission = {
        ...mockSubmission,
        status: "REPLIED" as const,
        repliedAt: new Date(),
      };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue(repliedSubmission);

      const result = await markContactSubmissionReplied(mockPrisma, mockSubmissionId);

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: {
          status: "REPLIED",
          repliedAt: expect.any(Date),
          replyContent: undefined,
        },
      });
      expect(result.status).toBe("REPLIED");
    });

    it("should mark submission as replied with content", async () => {
      const replyContent = "Thank you for contacting us...";
      const repliedSubmission = {
        ...mockSubmission,
        status: "REPLIED" as const,
        repliedAt: new Date(),
        replyContent,
      };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue(repliedSubmission);

      const result = await markContactSubmissionReplied(mockPrisma, mockSubmissionId, replyContent);

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: {
          status: "REPLIED",
          repliedAt: expect.any(Date),
          replyContent,
        },
      });
      expect(result.replyContent).toBe(replyContent);
    });
  });

  describe("archiveContactSubmission", () => {
    it("should archive submission with timestamp", async () => {
      const archivedSubmission = {
        ...mockSubmission,
        status: "ARCHIVED" as const,
        archivedAt: new Date(),
      };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue(archivedSubmission);

      const result = await archiveContactSubmission(mockPrisma, mockSubmissionId);

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: {
          status: "ARCHIVED",
          archivedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe("ARCHIVED");
    });
  });

  describe("markContactSubmissionSpam", () => {
    it("should mark submission as spam", async () => {
      const spamSubmission = { ...mockSubmission, status: "SPAM" as const };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue(spamSubmission);

      const result = await markContactSubmissionSpam(mockPrisma, mockSubmissionId);

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: { status: "SPAM" },
      });
      expect(result.status).toBe("SPAM");
    });
  });

  describe("assignContactSubmission", () => {
    it("should assign submission to user", async () => {
      const assignedSubmission = { ...mockSubmission, assignedTo: mockUserId };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue(assignedSubmission);

      const result = await assignContactSubmission(mockPrisma, mockSubmissionId, mockUserId);

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: { assignedTo: mockUserId },
      });
      expect(result.assignedTo).toBe(mockUserId);
    });
  });

  describe("unassignContactSubmission", () => {
    it("should unassign submission", async () => {
      const unassignedSubmission = { ...mockSubmission, assignedTo: null };
      vi.mocked(mockPrisma.contactSubmission.update).mockResolvedValue(unassignedSubmission);

      const result = await unassignContactSubmission(mockPrisma, mockSubmissionId);

      expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
        data: { assignedTo: null },
      });
      expect(result.assignedTo).toBeNull();
    });
  });

  describe("archiveOldContactSubmissions", () => {
    it("should archive submissions older than default 90 days", async () => {
      vi.mocked(mockPrisma.contactSubmission.updateMany).mockResolvedValue({ count: 25 });

      const result = await archiveOldContactSubmissions(mockPrisma);

      expect(mockPrisma.contactSubmission.updateMany).toHaveBeenCalledWith({
        where: {
          status: { in: ["NEW", "READ", "REPLIED"] },
          createdAt: { lt: expect.any(Date) },
        },
        data: {
          status: "ARCHIVED",
          archivedAt: expect.any(Date),
        },
      });
      expect(result).toBe(25);
    });

    it("should archive submissions older than custom days", async () => {
      vi.mocked(mockPrisma.contactSubmission.updateMany).mockResolvedValue({ count: 10 });

      const result = await archiveOldContactSubmissions(mockPrisma, 30);

      expect(result).toBe(10);
    });

    it("should filter by workspace when provided", async () => {
      vi.mocked(mockPrisma.contactSubmission.updateMany).mockResolvedValue({ count: 5 });

      await archiveOldContactSubmissions(mockPrisma, 90, mockWorkspaceId);

      expect(mockPrisma.contactSubmission.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          workspaceId: mockWorkspaceId,
        }),
        data: expect.any(Object),
      });
    });
  });

  describe("deleteContactSubmission", () => {
    it("should delete submission by ID", async () => {
      vi.mocked(mockPrisma.contactSubmission.delete).mockResolvedValue(mockSubmission);

      await deleteContactSubmission(mockPrisma, mockSubmissionId);

      expect(mockPrisma.contactSubmission.delete).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
      });
    });
  });

  describe("deleteSpamContactSubmissions", () => {
    it("should delete all spam submissions", async () => {
      vi.mocked(mockPrisma.contactSubmission.deleteMany).mockResolvedValue({ count: 50 });

      const result = await deleteSpamContactSubmissions(mockPrisma);

      expect(mockPrisma.contactSubmission.deleteMany).toHaveBeenCalledWith({
        where: { status: "SPAM" },
      });
      expect(result).toBe(50);
    });

    it("should delete spam submissions for specific workspace", async () => {
      vi.mocked(mockPrisma.contactSubmission.deleteMany).mockResolvedValue({ count: 10 });

      const result = await deleteSpamContactSubmissions(mockPrisma, mockWorkspaceId);

      expect(mockPrisma.contactSubmission.deleteMany).toHaveBeenCalledWith({
        where: { status: "SPAM", workspaceId: mockWorkspaceId },
      });
      expect(result).toBe(10);
    });
  });

  describe("listContactSubmissions", () => {
    it("should list submissions with default pagination", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(100);
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([mockSubmission]);

      const result = await listContactSubmissions(mockPrisma);

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 20,
      });
      expect(result.total).toBe(100);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(5);
    });

    it("should filter by status", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(10);
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([mockSubmission]);

      await listContactSubmissions(mockPrisma, { status: "NEW" });

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "NEW" },
        })
      );
    });

    it("should filter by category", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(5);
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([mockSubmission]);

      await listContactSubmissions(mockPrisma, { category: "support" });

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: "support" },
        })
      );
    });

    it("should filter by assignedTo", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(3);
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([]);

      await listContactSubmissions(mockPrisma, { assignedTo: mockUserId });

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assignedTo: mockUserId },
        })
      );
    });

    it("should filter by search term across multiple fields", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(2);
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([mockSubmission]);

      await listContactSubmissions(mockPrisma, { search: "john" });

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: "john", mode: "insensitive" } },
              { firstName: { contains: "john", mode: "insensitive" } },
              { lastName: { contains: "john", mode: "insensitive" } },
              { subject: { contains: "john", mode: "insensitive" } },
              { message: { contains: "john", mode: "insensitive" } },
            ],
          },
        })
      );
    });

    it("should filter by date range", async () => {
      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-01-31");

      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(10);
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([mockSubmission]);

      await listContactSubmissions(mockPrisma, { dateFrom, dateTo });

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: { gte: dateFrom, lte: dateTo },
          },
        })
      );
    });

    it("should handle custom pagination", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(200);
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([]);

      await listContactSubmissions(mockPrisma, { page: 5, limit: 25 });

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 100,
          take: 25,
        })
      );
    });

    it("should handle custom sorting", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(10);
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([]);

      await listContactSubmissions(mockPrisma, { orderBy: "priority", orderDir: "asc" });

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priority: "asc" },
        })
      );
    });
  });

  describe("getContactSubmissionStats", () => {
    it("should return stats for all submissions", async () => {
      vi.mocked(mockPrisma.contactSubmission.count)
        .mockResolvedValueOnce(200) // total
        .mockResolvedValueOnce(50) // new
        .mockResolvedValueOnce(30) // read
        .mockResolvedValueOnce(80) // replied
        .mockResolvedValueOnce(25) // archived
        .mockResolvedValueOnce(15) // spam
        .mockResolvedValueOnce(10) // today
        .mockResolvedValueOnce(45); // thisWeek

      const result = await getContactSubmissionStats(mockPrisma);

      expect(result).toEqual({
        total: 200,
        new: 50,
        read: 30,
        replied: 80,
        archived: 25,
        spam: 15,
        today: 10,
        thisWeek: 45,
      });
    });

    it("should filter by workspace when provided", async () => {
      vi.mocked(mockPrisma.contactSubmission.count).mockResolvedValue(10);

      await getContactSubmissionStats(mockPrisma, mockWorkspaceId);

      expect(mockPrisma.contactSubmission.count).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
      });
    });
  });

  describe("getContactSubmissionCategories", () => {
    it("should return distinct categories", async () => {
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([
        { category: "support" },
        { category: "sales" },
        { category: "feedback" },
      ] as ContactSubmission[]);

      const result = await getContactSubmissionCategories(mockPrisma);

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ["category"],
      });
      expect(result).toEqual(["support", "sales", "feedback"]);
    });

    it("should filter by workspace when provided", async () => {
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([]);

      await getContactSubmissionCategories(mockPrisma, mockWorkspaceId);

      expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith({
        where: { category: { not: null }, workspaceId: mockWorkspaceId },
        select: { category: true },
        distinct: ["category"],
      });
    });

    it("should filter out null categories", async () => {
      vi.mocked(mockPrisma.contactSubmission.findMany).mockResolvedValue([
        { category: "support" },
        { category: null },
        { category: "sales" },
      ] as ContactSubmission[]);

      const result = await getContactSubmissionCategories(mockPrisma);

      expect(result).toEqual(["support", "sales"]);
    });
  });
});
