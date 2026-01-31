# Phase 3: Template Management

> **Status:** ⏳ Pending  
> **Duration:** 4-5 days  
> **Branch:** `feature/email-package`  
> **Depends on:** Phase 2

## Objective

Implement full CRUD operations for email templates with Handlebars rendering, variable extraction, and validation.

---

## User Stories

### US-3.1: Template Prisma Schema

**As a** developer  
**I want** a database schema for email templates  
**So that** templates are persisted and queryable

**Acceptance Criteria:**

- [ ] `EmailTemplate` model in Prisma schema
- [ ] Fields: id, slug, name, subject, html, text, design (JSON)
- [ ] Category enum (transactional, marketing, etc.)
- [ ] Variables field (JSON array)
- [ ] Version tracking
- [ ] Audit fields (createdBy, updatedBy, timestamps)
- [ ] Organization scoping (multi-tenant)
- [ ] Migration runs successfully

### US-3.2: Template Types

**As a** developer  
**I want** TypeScript types for templates  
**So that** I have type safety when working with templates

**Acceptance Criteria:**

- [ ] `EmailTemplate` type matching Prisma model
- [ ] `CreateTemplateInput` type
- [ ] `UpdateTemplateInput` type
- [ ] `TemplateVariable` type (name, type, required, default)
- [ ] `RenderedEmail` type (subject, html, text)
- [ ] `TemplateCategory` enum

### US-3.3: Template Service - Create

**As a** developer  
**I want** to create email templates  
**So that** I can store reusable email content

**Acceptance Criteria:**

- [ ] `create(data)` creates template in database
- [ ] Auto-generates slug if not provided
- [ ] Extracts variables from html automatically
- [ ] Validates required fields
- [ ] Returns created template

### US-3.4: Template Service - Read

**As a** developer  
**I want** to retrieve email templates  
**So that** I can use them for sending emails

**Acceptance Criteria:**

- [ ] `findById(id)` returns template or null
- [ ] `findBySlug(slug)` returns template or null
- [ ] `list(options)` returns paginated results
- [ ] `listByCategory(category)` filters by category
- [ ] Supports organization filtering

### US-3.5: Template Service - Update

**As a** developer  
**I want** to update email templates  
**So that** I can modify template content

**Acceptance Criteria:**

- [ ] `update(id, data)` updates template
- [ ] Increments version on update
- [ ] Re-extracts variables if html changes
- [ ] Updates `updatedBy` and `updatedAt`
- [ ] Returns updated template

### US-3.6: Template Service - Delete

**As a** developer  
**I want** to delete email templates  
**So that** I can remove unused templates

**Acceptance Criteria:**

- [ ] `delete(id)` removes template
- [ ] Soft delete option (isActive = false)
- [ ] Prevents deletion of templates in use (optional)

### US-3.7: Template Duplication

**As a** developer  
**I want** to duplicate email templates  
**So that** I can create variations quickly

**Acceptance Criteria:**

- [ ] `duplicate(id, newSlug)` creates copy
- [ ] New template has version 1
- [ ] New template is marked as draft
- [ ] Updates createdBy to current user

### US-3.8: Variable Extraction

**As a** developer  
**I want** variables auto-extracted from templates  
**So that** I know what data is needed to render

**Acceptance Criteria:**

- [ ] Extracts `{{variableName}}` patterns
- [ ] Extracts `{{#if condition}}` blocks
- [ ] Extracts `{{#each items}}` loops
- [ ] Returns list of unique variable names
- [ ] Detects variable types where possible

### US-3.9: Template Rendering

**As a** developer  
**I want** to render templates with variables  
**So that** I can generate personalized emails

**Acceptance Criteria:**

- [ ] `render(templateId, variables)` returns rendered email
- [ ] `renderBySlug(slug, variables)` convenience method
- [ ] Uses Handlebars for interpolation
- [ ] Renders both subject and html
- [ ] Auto-generates text version if not provided
- [ ] Throws if required variables missing

### US-3.10: Template Validation

**As a** developer  
**I want** to validate template data  
**So that** I catch errors before rendering

**Acceptance Criteria:**

- [ ] `validateVariables(templateId, vars)` checks completeness
- [ ] Returns list of missing required variables
- [ ] Returns list of unknown variables (warning)
- [ ] Validates variable types

### US-3.11: Template Preview

**As a** developer  
**I want** to preview templates with sample data  
**So that** I can see how they look before sending

**Acceptance Criteria:**

- [ ] `preview(templateId, sampleData?)` renders preview
- [ ] Uses default sample data if not provided
- [ ] Generates sample data from variable definitions
- [ ] Returns rendered html for display

### US-3.12: Template API Routes

**As a** developer  
**I want** REST API endpoints for templates  
**So that** I can manage templates from the UI

**Acceptance Criteria:**

- [ ] `POST /api/email-templates` - Create
- [ ] `GET /api/email-templates` - List (paginated)
- [ ] `GET /api/email-templates/:id` - Get by ID
- [ ] `GET /api/email-templates/slug/:slug` - Get by slug
- [ ] `PUT /api/email-templates/:id` - Update
- [ ] `DELETE /api/email-templates/:id` - Delete
- [ ] `POST /api/email-templates/:id/duplicate` - Duplicate
- [ ] `POST /api/email-templates/:id/render` - Render
- [ ] `POST /api/email-templates/:id/preview` - Preview
- [ ] All routes have proper auth/role checks

### US-3.13: Send with Template

**As a** developer  
**I want** to send emails using templates  
**So that** I can use pre-defined content easily

**Acceptance Criteria:**

- [ ] `EmailService.sendTemplate(slug, options)` method
- [ ] Fetches template by slug
- [ ] Renders with provided variables
- [ ] Sends via configured provider
- [ ] Returns send result with template info

---

## Technical Specification

### Prisma Schema

```prisma
// prisma/schema.prisma

enum EmailTemplateCategory {
  TRANSACTIONAL
  MARKETING
  NEWSLETTER
  NOTIFICATION
  WELCOME
  VERIFICATION
  PASSWORD_RESET
  INVITATION
  REMINDER
  CUSTOM
}

model EmailTemplate {
  id             String   @id @default(cuid())

  // Identity
  slug           String   @unique
  name           String
  description    String?

  // Content
  subject        String
  html           String   @db.Text
  text           String?  @db.Text
  design         Json?    // For visual editors

  // Categorization
  category       EmailTemplateCategory @default(TRANSACTIONAL)
  tags           String[]

  // Variables (auto-extracted + manual)
  variables      Json     @default("[]")

  // Versioning
  version        Int      @default(1)
  isActive       Boolean  @default(true)
  isDefault      Boolean  @default(false)

  // Audit
  createdBy      String?
  updatedBy      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Multi-tenant
  organizationId String?

  @@index([category])
  @@index([slug])
  @@index([organizationId])
  @@index([isActive])
}
```

### Template Types

```typescript
// src/templates/types.ts

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  default?: unknown;
  description?: string;
}

export interface CreateTemplateInput {
  slug?: string;
  name: string;
  description?: string;
  subject: string;
  html: string;
  text?: string;
  design?: Record<string, unknown>;
  category?: EmailTemplateCategory;
  tags?: string[];
  variables?: TemplateVariable[];
  organizationId?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  subject?: string;
  html?: string;
  text?: string;
  design?: Record<string, unknown>;
  category?: EmailTemplateCategory;
  tags?: string[];
  variables?: TemplateVariable[];
  isActive?: boolean;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  templateId: string;
  templateSlug: string;
  variables: Record<string, unknown>;
}

export interface SendTemplateOptions {
  to: string | string[];
  variables: Record<string, unknown>;
  from?: EmailAddress;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  headers?: Record<string, string>;
}
```

### Template Service

```typescript
// src/templates/template.service.ts

export class TemplateService {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: CreateTemplateInput,
    userId?: string
  ): Promise<EmailTemplate> {
    const slug = data.slug || this.generateSlug(data.name);
    const variables = data.variables || this.extractVariables(data.html);

    return this.prisma.emailTemplate.create({
      data: {
        ...data,
        slug,
        variables,
        createdBy: userId,
      },
    });
  }

  async findById(id: string): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findUnique({ where: { slug } });
  }

  async update(
    id: string,
    data: UpdateTemplateInput,
    userId?: string
  ): Promise<EmailTemplate> {
    const template = await this.findById(id);
    if (!template) throw new TemplateNotFoundError(id);

    const variables = data.html ? this.extractVariables(data.html) : undefined;

    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...data,
        ...(variables && { variables }),
        version: { increment: 1 },
        updatedBy: userId,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.emailTemplate.delete({ where: { id } });
  }

  async duplicate(
    id: string,
    newSlug: string,
    userId?: string
  ): Promise<EmailTemplate> {
    const template = await this.findById(id);
    if (!template) throw new TemplateNotFoundError(id);

    return this.prisma.emailTemplate.create({
      data: {
        slug: newSlug,
        name: `${template.name} (Copy)`,
        description: template.description,
        subject: template.subject,
        html: template.html,
        text: template.text,
        design: template.design as any,
        category: template.category,
        tags: template.tags,
        variables: template.variables as any,
        organizationId: template.organizationId,
        createdBy: userId,
        version: 1,
      },
    });
  }

  async render(
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<RenderedEmail> {
    const template = await this.findById(templateId);
    if (!template) throw new TemplateNotFoundError(templateId);

    return this.renderTemplate(template, variables);
  }

  async renderBySlug(
    slug: string,
    variables: Record<string, unknown>
  ): Promise<RenderedEmail> {
    const template = await this.findBySlug(slug);
    if (!template) throw new TemplateNotFoundError(slug);

    return this.renderTemplate(template, variables);
  }

  private renderTemplate(
    template: EmailTemplate,
    variables: Record<string, unknown>
  ): RenderedEmail {
    // Validate required variables
    const validation = this.validateVariables(template, variables);
    if (!validation.valid) {
      throw new MissingVariablesError(validation.missing);
    }

    const subjectTemplate = Handlebars.compile(template.subject);
    const htmlTemplate = Handlebars.compile(template.html);
    const textTemplate = template.text
      ? Handlebars.compile(template.text)
      : null;

    return {
      subject: subjectTemplate(variables),
      html: htmlTemplate(variables),
      text: textTemplate
        ? textTemplate(variables)
        : this.htmlToText(htmlTemplate(variables)),
      templateId: template.id,
      templateSlug: template.slug,
      variables,
    };
  }

  extractVariables(html: string): TemplateVariable[] {
    const variableRegex = /\{\{([^{}]+)\}\}/g;
    const matches = html.matchAll(variableRegex);
    const variables = new Set<string>();

    for (const match of matches) {
      const varName = match[1].trim();
      // Skip helpers like #if, #each, /if, /each
      if (!varName.startsWith("#") && !varName.startsWith("/")) {
        // Handle nested paths like user.name
        const rootVar = varName.split(".")[0].split(" ")[0];
        variables.add(rootVar);
      }
    }

    return Array.from(variables).map(name => ({
      name,
      type: "string" as const,
      required: true,
    }));
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }
}
```

### Email Service Extension

```typescript
// src/service/email.service.ts (additions)

export class EmailService {
  // ... existing methods

  static async sendTemplate(
    slug: string,
    options: SendTemplateOptions
  ): Promise<SendResult & { templateId: string }> {
    const templateService = new TemplateService(prisma);
    const rendered = await templateService.renderBySlug(
      slug,
      options.variables
    );

    const result = await this.send({
      to: options.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      from: options.from,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      headers: options.headers,
    });

    return {
      ...result,
      templateId: rendered.templateId,
    };
  }
}
```

---

## API Routes

### Create Template

```
POST /api/email-templates
Body: CreateTemplateInput
Response: EmailTemplate
```

### List Templates

```
GET /api/email-templates?page=1&limit=20&category=TRANSACTIONAL
Response: { data: EmailTemplate[], pagination: {...} }
```

### Get Template by ID

```
GET /api/email-templates/:id
Response: EmailTemplate
```

### Get Template by Slug

```
GET /api/email-templates/slug/:slug
Response: EmailTemplate
```

### Update Template

```
PUT /api/email-templates/:id
Body: UpdateTemplateInput
Response: EmailTemplate
```

### Delete Template

```
DELETE /api/email-templates/:id
Response: { success: true }
```

### Duplicate Template

```
POST /api/email-templates/:id/duplicate
Body: { slug: string }
Response: EmailTemplate
```

### Render Template

```
POST /api/email-templates/:id/render
Body: { variables: Record<string, unknown> }
Response: RenderedEmail
```

### Preview Template

```
POST /api/email-templates/:id/preview
Body: { variables?: Record<string, unknown> }
Response: RenderedEmail
```

---

## Dependencies

```json
{
  "dependencies": {
    "handlebars": "^4.7.0",
    "html-to-text": "^9.0.0"
  },
  "devDependencies": {
    "@types/html-to-text": "^9.0.0"
  }
}
```

---

## Definition of Done

- [ ] Prisma schema added and migrated
- [ ] All CRUD operations working
- [ ] Variable extraction working
- [ ] Handlebars rendering working
- [ ] All API routes implemented
- [ ] `sendTemplate()` working
- [ ] Unit tests passing
- [ ] API tests passing

---

## Estimated Effort

| Task                      | Hours               |
| ------------------------- | ------------------- |
| Prisma schema             | 2h                  |
| Template types            | 2h                  |
| Template service (CRUD)   | 6h                  |
| Variable extraction       | 3h                  |
| Handlebars rendering      | 4h                  |
| Validation                | 2h                  |
| API routes                | 6h                  |
| EmailService.sendTemplate | 2h                  |
| Unit tests                | 4h                  |
| API tests                 | 3h                  |
| **Total**                 | **~34h (4-5 days)** |
