# Phase 5: Tracking & Compliance

> **Status:** ⏳ Pending  
> **Duration:** 2-3 days  
> **Branch:** `feature/email-package`  
> **Depends on:** Phase 4

## Objective

Implement email tracking (opens, clicks) and compliance features (unsubscribe, preferences, headers).

---

## User Stories

### US-5.1: Tracking Types

**As a** developer  
**I want** tracking-related types  
**So that** I have type safety for tracking features

**Acceptance Criteria:**

- [ ] `TrackingConfig` interface
- [ ] `TrackingEvent` type (open, click)
- [ ] `EmailMetrics` interface
- [ ] `UnsubscribeToken` type

### US-5.2: Open Tracking (Pixel)

**As a** developer  
**I want** to track email opens  
**So that** I can measure engagement

**Acceptance Criteria:**

- [ ] 1x1 transparent tracking pixel generated
- [ ] Pixel inserted at end of HTML body
- [ ] Unique tracking ID per email
- [ ] `/api/track/open/:trackingId` endpoint
- [ ] Records open event with timestamp, IP, user-agent

### US-5.3: Click Tracking

**As a** developer  
**I want** to track link clicks  
**So that** I can measure engagement

**Acceptance Criteria:**

- [ ] Links in HTML rewritten to tracking URLs
- [ ] `/api/track/click/:trackingId` endpoint
- [ ] Records click event with link URL
- [ ] Redirects to original URL
- [ ] Preserves link attributes (target, rel)

### US-5.4: Tracking Toggle

**As a** developer  
**I want** to enable/disable tracking per email  
**So that** I can respect privacy preferences

**Acceptance Criteria:**

- [ ] `trackOpens: boolean` option
- [ ] `trackClicks: boolean` option
- [ ] Global config default
- [ ] Per-email override

### US-5.5: Email Metrics

**As a** developer  
**I want** to query email metrics  
**So that** I can build analytics dashboards

**Acceptance Criteria:**

- [ ] `getMetrics(trackingId)` returns metrics
- [ ] Includes: sent, delivered, opened, clicked
- [ ] Includes: open count, click count, unique opens
- [ ] Includes: first open time, last open time

### US-5.6: Unsubscribe Link

**As a** developer  
**I want** automatic unsubscribe links  
**So that** emails are CAN-SPAM compliant

**Acceptance Criteria:**

- [ ] `{{unsubscribeUrl}}` template variable
- [ ] Generates secure unsubscribe token
- [ ] `/api/email/unsubscribe/:token` endpoint
- [ ] One-click unsubscribe support

### US-5.7: Email Preferences

**As a** developer  
**I want** users to manage email preferences  
**So that** they can choose what to receive

**Acceptance Criteria:**

- [ ] Preference categories (marketing, transactional, etc.)
- [ ] `/api/email/preferences/:token` page
- [ ] Toggle individual categories
- [ ] Unsubscribe from all option

### US-5.8: Compliance Headers

**As a** developer  
**I want** proper email headers  
**So that** emails are legally compliant

**Acceptance Criteria:**

- [ ] `List-Unsubscribe` header added
- [ ] `List-Unsubscribe-Post` header (one-click)
- [ ] `Message-ID` header
- [ ] `X-Entity-Ref-ID` for tracking
- [ ] Configurable header customization

### US-5.9: Bounce Handling

**As a** developer  
**I want** to handle bounced emails  
**So that** I can maintain list hygiene

**Acceptance Criteria:**

- [ ] Webhook endpoint for bounce notifications
- [ ] Records bounce type (hard/soft)
- [ ] Marks email as bounced
- [ ] Optional: auto-suppress after N bounces

### US-5.10: Tracking Database Schema

**As a** developer  
**I want** schema for tracking data  
**So that** events are persisted

**Acceptance Criteria:**

- [ ] `EmailEvent` model (opens, clicks, bounces)
- [ ] `EmailPreference` model (subscriptions)
- [ ] Indexed for fast queries
- [ ] Retention policy support

---

## Technical Specification

### Directory Structure

```
packages/email/src/tracking/
├── index.ts
├── types.ts
├── tracking.service.ts
├── pixel.ts
├── link-rewriter.ts
└── metrics.ts

packages/email/src/compliance/
├── index.ts
├── unsubscribe.ts
├── preferences.ts
└── headers.ts
```

### Prisma Schema

```prisma
model EmailEvent {
  id           String   @id @default(cuid())
  trackingId   String
  type         EmailEventType

  // Event data
  timestamp    DateTime @default(now())
  ipAddress    String?
  userAgent    String?
  linkUrl      String?  // For clicks

  // Metadata
  metadata     Json?

  @@index([trackingId])
  @@index([type])
  @@index([timestamp])
}

enum EmailEventType {
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  COMPLAINED
  UNSUBSCRIBED
}

model EmailPreference {
  id           String   @id @default(cuid())
  email        String
  token        String   @unique

  // Categories
  marketing    Boolean  @default(true)
  transactional Boolean @default(true)
  newsletter   Boolean  @default(true)

  // Global
  unsubscribedAll Boolean @default(false)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([email])
  @@index([token])
}
```

### Tracking Types

```typescript
// src/tracking/types.ts

export interface TrackingConfig {
  enabled: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  baseUrl: string;
}

export interface TrackingContext {
  trackingId: string;
  email: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailMetrics {
  trackingId: string;
  sent: boolean;
  sentAt?: Date;
  delivered: boolean;
  deliveredAt?: Date;
  opened: boolean;
  openCount: number;
  uniqueOpens: number;
  firstOpenAt?: Date;
  lastOpenAt?: Date;
  clicked: boolean;
  clickCount: number;
  uniqueClicks: number;
  clickedLinks: Array<{ url: string; count: number }>;
  bounced: boolean;
  bounceType?: "hard" | "soft";
  unsubscribed: boolean;
}
```

### Tracking Pixel

```typescript
// src/tracking/pixel.ts

export function createTrackingPixel(
  trackingId: string,
  baseUrl: string
): string {
  const pixelUrl = `${baseUrl}/api/track/open/${trackingId}`;
  return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
}

export function insertTrackingPixel(
  html: string,
  trackingId: string,
  baseUrl: string
): string {
  const pixel = createTrackingPixel(trackingId, baseUrl);

  // Insert before </body> if exists, otherwise append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return html + pixel;
}
```

### Link Rewriter

```typescript
// src/tracking/link-rewriter.ts
import * as cheerio from "cheerio";

export function rewriteLinks(
  html: string,
  trackingId: string,
  baseUrl: string
): string {
  const $ = cheerio.load(html);

  $("a[href]").each((_, element) => {
    const $link = $(element);
    const originalUrl = $link.attr("href");

    // Skip special links
    if (
      !originalUrl ||
      originalUrl.startsWith("#") ||
      originalUrl.startsWith("mailto:") ||
      originalUrl.startsWith("tel:") ||
      originalUrl.includes("unsubscribe")
    ) {
      return;
    }

    // Create tracking URL
    const trackingUrl = createClickTrackingUrl(
      trackingId,
      originalUrl,
      baseUrl
    );

    $link.attr("href", trackingUrl);
    $link.attr("data-original-href", originalUrl);
  });

  return $.html();
}

function createClickTrackingUrl(
  trackingId: string,
  originalUrl: string,
  baseUrl: string
): string {
  const encoded = encodeURIComponent(originalUrl);
  return `${baseUrl}/api/track/click/${trackingId}?url=${encoded}`;
}
```

### Tracking Service

```typescript
// src/tracking/tracking.service.ts

export class TrackingService {
  constructor(private prisma: PrismaClient) {}

  async addTracking(
    html: string,
    context: TrackingContext,
    config: TrackingConfig
  ): Promise<string> {
    let result = html;

    if (config.trackOpens) {
      result = insertTrackingPixel(result, context.trackingId, config.baseUrl);
    }

    if (config.trackClicks) {
      result = rewriteLinks(result, context.trackingId, config.baseUrl);
    }

    return result;
  }

  async recordOpen(trackingId: string, req: Request): Promise<void> {
    await this.prisma.emailEvent.create({
      data: {
        trackingId,
        type: "OPENED",
        ipAddress: this.getClientIp(req),
        userAgent: req.headers.get("user-agent"),
      },
    });
  }

  async recordClick(
    trackingId: string,
    url: string,
    req: Request
  ): Promise<void> {
    await this.prisma.emailEvent.create({
      data: {
        trackingId,
        type: "CLICKED",
        linkUrl: url,
        ipAddress: this.getClientIp(req),
        userAgent: req.headers.get("user-agent"),
      },
    });
  }

  async getMetrics(trackingId: string): Promise<EmailMetrics> {
    const events = await this.prisma.emailEvent.findMany({
      where: { trackingId },
      orderBy: { timestamp: "asc" },
    });

    return this.calculateMetrics(trackingId, events);
  }

  private calculateMetrics(
    trackingId: string,
    events: EmailEvent[]
  ): EmailMetrics {
    const opens = events.filter(e => e.type === "OPENED");
    const clicks = events.filter(e => e.type === "CLICKED");
    const uniqueOpenIps = new Set(opens.map(e => e.ipAddress));
    const uniqueClickIps = new Set(clicks.map(e => e.ipAddress));

    // Count clicks per URL
    const clicksByUrl = clicks.reduce(
      (acc, e) => {
        const url = e.linkUrl || "unknown";
        acc[url] = (acc[url] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      trackingId,
      sent: events.some(e => e.type === "SENT"),
      sentAt: events.find(e => e.type === "SENT")?.timestamp,
      delivered: events.some(e => e.type === "DELIVERED"),
      deliveredAt: events.find(e => e.type === "DELIVERED")?.timestamp,
      opened: opens.length > 0,
      openCount: opens.length,
      uniqueOpens: uniqueOpenIps.size,
      firstOpenAt: opens[0]?.timestamp,
      lastOpenAt: opens[opens.length - 1]?.timestamp,
      clicked: clicks.length > 0,
      clickCount: clicks.length,
      uniqueClicks: uniqueClickIps.size,
      clickedLinks: Object.entries(clicksByUrl).map(([url, count]) => ({
        url,
        count,
      })),
      bounced: events.some(e => e.type === "BOUNCED"),
      bounceType: events.find(e => e.type === "BOUNCED")?.metadata?.type as
        | "hard"
        | "soft",
      unsubscribed: events.some(e => e.type === "UNSUBSCRIBED"),
    };
  }
}
```

### Compliance Headers

```typescript
// src/compliance/headers.ts

export function addComplianceHeaders(
  headers: Record<string, string>,
  unsubscribeUrl: string,
  messageId: string
): Record<string, string> {
  return {
    ...headers,
    "Message-ID": `<${messageId}@${getDomain()}>`,
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "X-Entity-Ref-ID": messageId,
    "Feedback-ID": `${messageId}:campaign:${getDomain()}`,
  };
}
```

### Unsubscribe Service

```typescript
// src/compliance/unsubscribe.ts
import { createHash, randomBytes } from "crypto";

export class UnsubscribeService {
  constructor(private prisma: PrismaClient) {}

  async generateToken(email: string): Promise<string> {
    const existing = await this.prisma.emailPreference.findUnique({
      where: { email },
    });

    if (existing) {
      return existing.token;
    }

    const token = this.createSecureToken(email);

    await this.prisma.emailPreference.create({
      data: { email, token },
    });

    return token;
  }

  async unsubscribe(token: string, category?: string): Promise<boolean> {
    const preference = await this.prisma.emailPreference.findUnique({
      where: { token },
    });

    if (!preference) return false;

    if (category) {
      await this.prisma.emailPreference.update({
        where: { token },
        data: { [category]: false },
      });
    } else {
      await this.prisma.emailPreference.update({
        where: { token },
        data: { unsubscribedAll: true },
      });
    }

    return true;
  }

  async isSubscribed(email: string, category: string): Promise<boolean> {
    const preference = await this.prisma.emailPreference.findUnique({
      where: { email },
    });

    if (!preference) return true; // Default subscribed
    if (preference.unsubscribedAll) return false;

    return preference[category as keyof EmailPreference] !== false;
  }

  getUnsubscribeUrl(token: string, baseUrl: string): string {
    return `${baseUrl}/api/email/unsubscribe/${token}`;
  }

  private createSecureToken(email: string): string {
    const random = randomBytes(16).toString("hex");
    const hash = createHash("sha256")
      .update(`${email}:${random}:${Date.now()}`)
      .digest("hex")
      .slice(0, 32);
    return hash;
  }
}
```

---

## API Routes

### Open Tracking

```
GET /api/track/open/:trackingId
Response: 1x1 transparent GIF
```

### Click Tracking

```
GET /api/track/click/:trackingId?url=...
Response: 302 Redirect to original URL
```

### Unsubscribe (One-Click)

```
POST /api/email/unsubscribe/:token
Response: { success: true }
```

### Unsubscribe Page

```
GET /api/email/unsubscribe/:token
Response: HTML page with options
```

### Get Preferences

```
GET /api/email/preferences/:token
Response: EmailPreference
```

### Update Preferences

```
PUT /api/email/preferences/:token
Body: { marketing: false, newsletter: true }
Response: EmailPreference
```

### Get Metrics

```
GET /api/email/metrics/:trackingId
Response: EmailMetrics
```

---

## Dependencies

```json
{
  "dependencies": {
    "cheerio": "^1.0.0"
  }
}
```

---

## Definition of Done

- [ ] Open tracking working
- [ ] Click tracking working
- [ ] Metrics aggregation working
- [ ] Unsubscribe flow working
- [ ] Preferences management working
- [ ] Compliance headers added
- [ ] All endpoints tested
- [ ] Documentation updated

---

## Estimated Effort

| Task               | Hours             |
| ------------------ | ----------------- |
| Tracking types     | 1h                |
| Prisma schema      | 2h                |
| Tracking pixel     | 2h                |
| Link rewriter      | 3h                |
| Tracking service   | 3h                |
| Metrics            | 2h                |
| Unsubscribe        | 3h                |
| Preferences        | 2h                |
| Compliance headers | 1h                |
| API routes         | 3h                |
| Tests              | 3h                |
| **Total**          | **~25h (3 days)** |
