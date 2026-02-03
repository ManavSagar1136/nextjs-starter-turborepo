import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNewsletterSubscriber } from "../create-newsletter-subscriber";
import {
  getNewsletterSubscriberById,
  getNewsletterSubscriberByEmail,
  getNewsletterSubscriberByToken,
  isEmailSubscribedToNewsletter,
} from "../get-newsletter-subscriber";
import {
  updateNewsletterSubscriber,
  confirmNewsletterSubscriber,
  unsubscribeNewsletterByEmail,
  unsubscribeNewsletterById,
  markNewsletterSubscriberBounced,
  markNewsletterSubscriberComplained,
  deleteNewsletterSubscriber,
} from "../update-newsletter-subscriber";
import {
  listNewsletterSubscribers,
  getNewsletterSubscriberStats,
  getActiveNewsletterEmails,
} from "../list-newsletter-subscribers";
import type { PrismaClient, NewsletterSubscriber } from "../../generated/client";

// Mock prisma client
const mockPrisma = {
  newsletterSubscriber: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe("Newsletter Subscriber Repository", () => {
  const mockSubscriberId = "sub-123";
  const mockEmail = "test@example.com";
  const mockWorkspaceId = "workspace-456";
  const mockConfirmToken = "abc123token";

  const mockSubscriber: NewsletterSubscriber = {
    id: mockSubscriberId,
    email: mockEmail,
    status: "ACTIVE",
    isConfirmed: true,
    confirmedAt: new Date("2024-01-01T10:00:00Z"),
    subscribedAt: new Date("2024-01-01T10:00:00Z"),
    unsubscribedAt: null,
    confirmToken: null,
    source: "website",
    sourceIp: "192.168.1.1",
    referrer: "https://google.com",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "launch",
    utmTerm: null,
    utmContent: null,
    workspaceId: mockWorkspaceId,
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

  describe("createNewsletterSubscriber", () => {
    it("should create a new subscriber", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.newsletterSubscriber.create).mockResolvedValue(mockSubscriber);

      const result = await createNewsletterSubscriber(mockPrisma, {
        email: "  TEST@example.com  ",
        source: "website",
        sourceIp: "192.168.1.1",
      });

      expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalled();
      expect(result.isNew).toBe(true);
      expect(result.subscriber).toEqual(mockSubscriber);
    });

    it("should return existing subscriber if already subscribed", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(mockSubscriber);

      const result = await createNewsletterSubscriber(mockPrisma, {
        email: mockEmail,
      });

      expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled();
      expect(result.isNew).toBe(false);
      expect(result.subscriber).toEqual(mockSubscriber);
    });

    it("should resubscribe previously unsubscribed user", async () => {
      const unsubscribedSubscriber = {
        ...mockSubscriber,
        status: "UNSUBSCRIBED" as const,
        unsubscribedAt: new Date(),
      };
      const resubscribedSubscriber = {
        ...mockSubscriber,
        status: "ACTIVE" as const,
        unsubscribedAt: null,
      };

      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(unsubscribedSubscriber);
      vi.mocked(mockPrisma.newsletterSubscriber.update).mockResolvedValue(resubscribedSubscriber);

      const result = await createNewsletterSubscriber(mockPrisma, {
        email: mockEmail,
      });

      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: mockSubscriberId },
        data: expect.objectContaining({
          status: "ACTIVE",
          unsubscribedAt: null,
        }),
      });
      expect(result.isNew).toBe(false);
      expect(result.subscriber.status).toBe("ACTIVE");
    });

    it("should normalize email to lowercase", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.newsletterSubscriber.create).mockResolvedValue(mockSubscriber);

      await createNewsletterSubscriber(mockPrisma, {
        email: "  TEST@EXAMPLE.COM  ",
      });

      expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("should create subscriber with UTM parameters", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.newsletterSubscriber.create).mockResolvedValue(mockSubscriber);

      await createNewsletterSubscriber(mockPrisma, {
        email: mockEmail,
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "launch",
      });

      expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "launch",
        }),
      });
    });

    it("should create subscriber with confirmation token when requireConfirmation is true", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.newsletterSubscriber.create).mockResolvedValue({
        ...mockSubscriber,
        isConfirmed: false,
        confirmedAt: null,
        confirmToken: "sometoken",
      });

      await createNewsletterSubscriber(mockPrisma, {
        email: mockEmail,
        requireConfirmation: true,
      });

      expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isConfirmed: false,
          confirmedAt: null,
          confirmToken: expect.any(String),
        }),
      });
    });
  });

  describe("getNewsletterSubscriberById", () => {
    it("should return subscriber when found", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(mockSubscriber);

      const result = await getNewsletterSubscriberById(mockPrisma, mockSubscriberId);

      expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { id: mockSubscriberId },
      });
      expect(result).toEqual(mockSubscriber);
    });

    it("should return null when not found", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(null);

      const result = await getNewsletterSubscriberById(mockPrisma, "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getNewsletterSubscriberByEmail", () => {
    it("should return subscriber by email", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(mockSubscriber);

      const result = await getNewsletterSubscriberByEmail(mockPrisma, mockEmail);

      expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(result).toEqual(mockSubscriber);
    });

    it("should normalize email before lookup", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(mockSubscriber);

      await getNewsletterSubscriberByEmail(mockPrisma, "  TEST@EXAMPLE.COM  ");

      expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });
  });

  describe("getNewsletterSubscriberByToken", () => {
    it("should return subscriber by confirmation token", async () => {
      const subscriberWithToken = { ...mockSubscriber, confirmToken: mockConfirmToken };
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(subscriberWithToken);

      const result = await getNewsletterSubscriberByToken(mockPrisma, mockConfirmToken);

      expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { confirmToken: mockConfirmToken },
      });
      expect(result).toEqual(subscriberWithToken);
    });
  });

  describe("isEmailSubscribedToNewsletter", () => {
    it("should return true for active confirmed subscriber", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue({
        status: "ACTIVE",
        isConfirmed: true,
      } as NewsletterSubscriber);

      const result = await isEmailSubscribedToNewsletter(mockPrisma, mockEmail);

      expect(result).toBe(true);
    });

    it("should return false for unsubscribed user", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue({
        status: "UNSUBSCRIBED",
        isConfirmed: true,
      } as NewsletterSubscriber);

      const result = await isEmailSubscribedToNewsletter(mockPrisma, mockEmail);

      expect(result).toBe(false);
    });

    it("should return false for unconfirmed subscriber", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue({
        status: "ACTIVE",
        isConfirmed: false,
      } as NewsletterSubscriber);

      const result = await isEmailSubscribedToNewsletter(mockPrisma, mockEmail);

      expect(result).toBe(false);
    });

    it("should return false when subscriber not found", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(null);

      const result = await isEmailSubscribedToNewsletter(mockPrisma, mockEmail);

      expect(result).toBe(false);
    });
  });

  describe("updateNewsletterSubscriber", () => {
    it("should update subscriber status", async () => {
      const updatedSubscriber = { ...mockSubscriber, status: "UNSUBSCRIBED" as const };
      vi.mocked(mockPrisma.newsletterSubscriber.update).mockResolvedValue(updatedSubscriber);

      const result = await updateNewsletterSubscriber(mockPrisma, mockSubscriberId, {
        status: "UNSUBSCRIBED",
      });

      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: mockSubscriberId },
        data: expect.objectContaining({ status: "UNSUBSCRIBED" }),
      });
      expect(result.status).toBe("UNSUBSCRIBED");
    });

    it("should update subscriber with metadata", async () => {
      const metadata = { customField: "value" };
      vi.mocked(mockPrisma.newsletterSubscriber.update).mockResolvedValue({
        ...mockSubscriber,
        metadata,
      });

      await updateNewsletterSubscriber(mockPrisma, mockSubscriberId, { metadata });

      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: mockSubscriberId },
        data: expect.objectContaining({ metadata }),
      });
    });
  });

  describe("confirmNewsletterSubscriber", () => {
    it("should confirm subscriber and clear token", async () => {
      const unconfirmedSubscriber = {
        ...mockSubscriber,
        isConfirmed: false,
        confirmToken: mockConfirmToken,
      };
      const confirmedSubscriber = {
        ...mockSubscriber,
        isConfirmed: true,
        confirmToken: null,
        confirmedAt: expect.any(Date),
      };

      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(unconfirmedSubscriber);
      vi.mocked(mockPrisma.newsletterSubscriber.update).mockResolvedValue(confirmedSubscriber);

      const result = await confirmNewsletterSubscriber(mockPrisma, mockConfirmToken);

      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: mockSubscriberId },
        data: {
          isConfirmed: true,
          confirmedAt: expect.any(Date),
          confirmToken: null,
        },
      });
      expect(result?.isConfirmed).toBe(true);
    });

    it("should return null when token not found", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(null);

      const result = await confirmNewsletterSubscriber(mockPrisma, "invalid-token");

      expect(mockPrisma.newsletterSubscriber.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return existing subscriber if already confirmed", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(mockSubscriber);

      const result = await confirmNewsletterSubscriber(mockPrisma, mockConfirmToken);

      expect(mockPrisma.newsletterSubscriber.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockSubscriber);
    });
  });

  describe("unsubscribeNewsletterByEmail", () => {
    it("should unsubscribe subscriber by email", async () => {
      const unsubscribedSubscriber = {
        ...mockSubscriber,
        status: "UNSUBSCRIBED" as const,
        unsubscribedAt: expect.any(Date),
      };

      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(mockSubscriber);
      vi.mocked(mockPrisma.newsletterSubscriber.update).mockResolvedValue(unsubscribedSubscriber);

      const result = await unsubscribeNewsletterByEmail(mockPrisma, mockEmail);

      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: mockSubscriberId },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: expect.any(Date),
        },
      });
      expect(result?.status).toBe("UNSUBSCRIBED");
    });

    it("should return null when email not found", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(null);

      const result = await unsubscribeNewsletterByEmail(mockPrisma, "unknown@example.com");

      expect(mockPrisma.newsletterSubscriber.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return existing subscriber if already unsubscribed", async () => {
      const alreadyUnsubscribed = {
        ...mockSubscriber,
        status: "UNSUBSCRIBED" as const,
      };
      vi.mocked(mockPrisma.newsletterSubscriber.findUnique).mockResolvedValue(alreadyUnsubscribed);

      const result = await unsubscribeNewsletterByEmail(mockPrisma, mockEmail);

      expect(mockPrisma.newsletterSubscriber.update).not.toHaveBeenCalled();
      expect(result).toEqual(alreadyUnsubscribed);
    });
  });

  describe("unsubscribeNewsletterById", () => {
    it("should unsubscribe subscriber by ID", async () => {
      const unsubscribedSubscriber = {
        ...mockSubscriber,
        status: "UNSUBSCRIBED" as const,
      };
      vi.mocked(mockPrisma.newsletterSubscriber.update).mockResolvedValue(unsubscribedSubscriber);

      const result = await unsubscribeNewsletterById(mockPrisma, mockSubscriberId);

      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: mockSubscriberId },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe("UNSUBSCRIBED");
    });
  });

  describe("markNewsletterSubscriberBounced", () => {
    it("should mark subscriber as bounced", async () => {
      const bouncedSubscriber = { ...mockSubscriber, status: "BOUNCED" as const };
      vi.mocked(mockPrisma.newsletterSubscriber.update).mockResolvedValue(bouncedSubscriber);

      const result = await markNewsletterSubscriberBounced(mockPrisma, mockEmail);

      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { email: mockEmail },
        data: { status: "BOUNCED" },
      });
      expect(result?.status).toBe("BOUNCED");
    });
  });

  describe("markNewsletterSubscriberComplained", () => {
    it("should mark subscriber as complained", async () => {
      const complainedSubscriber = { ...mockSubscriber, status: "COMPLAINED" as const };
      vi.mocked(mockPrisma.newsletterSubscriber.update).mockResolvedValue(complainedSubscriber);

      const result = await markNewsletterSubscriberComplained(mockPrisma, mockEmail);

      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { email: mockEmail },
        data: { status: "COMPLAINED" },
      });
      expect(result?.status).toBe("COMPLAINED");
    });
  });

  describe("deleteNewsletterSubscriber", () => {
    it("should delete subscriber by ID", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.delete).mockResolvedValue(mockSubscriber);

      await deleteNewsletterSubscriber(mockPrisma, mockSubscriberId);

      expect(mockPrisma.newsletterSubscriber.delete).toHaveBeenCalledWith({
        where: { id: mockSubscriberId },
      });
    });
  });

  describe("listNewsletterSubscribers", () => {
    it("should list subscribers with default pagination", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.count).mockResolvedValue(50);
      vi.mocked(mockPrisma.newsletterSubscriber.findMany).mockResolvedValue([mockSubscriber]);

      const result = await listNewsletterSubscribers(mockPrisma);

      expect(mockPrisma.newsletterSubscriber.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { subscribedAt: "desc" },
        skip: 0,
        take: 20,
      });
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(3);
    });

    it("should filter by status", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.count).mockResolvedValue(10);
      vi.mocked(mockPrisma.newsletterSubscriber.findMany).mockResolvedValue([mockSubscriber]);

      await listNewsletterSubscribers(mockPrisma, { status: "ACTIVE" });

      expect(mockPrisma.newsletterSubscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "ACTIVE" },
        })
      );
    });

    it("should filter by workspaceId", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.count).mockResolvedValue(5);
      vi.mocked(mockPrisma.newsletterSubscriber.findMany).mockResolvedValue([mockSubscriber]);

      await listNewsletterSubscribers(mockPrisma, { workspaceId: mockWorkspaceId });

      expect(mockPrisma.newsletterSubscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: mockWorkspaceId },
        })
      );
    });

    it("should filter by search term", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.count).mockResolvedValue(1);
      vi.mocked(mockPrisma.newsletterSubscriber.findMany).mockResolvedValue([mockSubscriber]);

      await listNewsletterSubscribers(mockPrisma, { search: "test" });

      expect(mockPrisma.newsletterSubscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: { contains: "test", mode: "insensitive" } },
        })
      );
    });

    it("should handle custom pagination", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.count).mockResolvedValue(100);
      vi.mocked(mockPrisma.newsletterSubscriber.findMany).mockResolvedValue([]);

      await listNewsletterSubscribers(mockPrisma, { page: 3, limit: 10 });

      expect(mockPrisma.newsletterSubscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });
  });

  describe("getNewsletterSubscriberStats", () => {
    it("should return stats for all subscribers", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(10) // unsubscribed
        .mockResolvedValueOnce(5) // bounced
        .mockResolvedValueOnce(2) // complained
        .mockResolvedValueOnce(90); // confirmed

      const result = await getNewsletterSubscriberStats(mockPrisma);

      expect(result).toEqual({
        total: 100,
        active: 80,
        unsubscribed: 10,
        bounced: 5,
        complained: 2,
        confirmed: 90,
        unconfirmed: 10,
      });
    });

    it("should return stats for specific workspace", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.count).mockResolvedValue(10);

      await getNewsletterSubscriberStats(mockPrisma, mockWorkspaceId);

      expect(mockPrisma.newsletterSubscriber.count).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
      });
    });
  });

  describe("getActiveNewsletterEmails", () => {
    it("should return active confirmed emails", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findMany).mockResolvedValue([
        { email: "user1@example.com" },
        { email: "user2@example.com" },
      ] as NewsletterSubscriber[]);

      const result = await getActiveNewsletterEmails(mockPrisma);

      expect(mockPrisma.newsletterSubscriber.findMany).toHaveBeenCalledWith({
        where: {
          status: "ACTIVE",
          isConfirmed: true,
        },
        select: { email: true },
      });
      expect(result).toEqual(["user1@example.com", "user2@example.com"]);
    });

    it("should filter by workspace when provided", async () => {
      vi.mocked(mockPrisma.newsletterSubscriber.findMany).mockResolvedValue([]);

      await getActiveNewsletterEmails(mockPrisma, mockWorkspaceId);

      expect(mockPrisma.newsletterSubscriber.findMany).toHaveBeenCalledWith({
        where: {
          status: "ACTIVE",
          isConfirmed: true,
          workspaceId: mockWorkspaceId,
        },
        select: { email: true },
      });
    });
  });
});
