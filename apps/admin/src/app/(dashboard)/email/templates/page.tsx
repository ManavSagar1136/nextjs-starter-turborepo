"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { FileText, Plus, Edit, Trash2, Eye, Palette, Mail } from "lucide-react";
import { useDialogManager, type CommonDialogProps, COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { API } from "@/services";
import type { EmailTemplate } from "@/services/email";
import { EmailTemplateType } from "@buildbase/database";

const EmailTemplatesPage = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { openDialog } = useDialogManager();

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await API.email.templates.list();
      setTemplates(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [refreshCounter]);

  const handleCreate = () => {
    const props: CommonDialogProps<"email-template"> = {
      mode: "create",
      onSaveTemplate: async (data: any) => {
        return await API.email.templates.create(data);
      },
      onSuccess: () => {
        setRefreshCounter(prev => prev + 1);
      },
    };
    openDialog(COMMON_DIALOG_KEYS.EMAIL_TEMPLATE, props);
  };

  const handleEdit = (template: EmailTemplate) => {
    const props: CommonDialogProps<"email-template"> = {
      mode: "edit",
      templateId: template.id,
      initialData: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        category: template.category,
        isActive: template.isActive,
      },
      onFetchTemplate: async (id: string) => {
        const data = await API.email.templates.getById(id);
        return {
          slug: data.slug,
          name: data.name,
          description: data.description,
          subject: data.subject,
          html: data.html,
          text: data.text,
          design: data.design,
          category: data.category,
          isActive: data.isActive,
        };
      },
      onSaveTemplate: async (data: any, mode: "create" | "edit", id?: string) => {
        if (mode === "create") {
          return await API.email.templates.create(data);
        } else if (id) {
          return await API.email.templates.update(id, data);
        }
        throw new Error("Template ID is required for edit mode");
      },
      onSuccess: () => {
        setRefreshCounter(prev => prev + 1);
      },
    };
    openDialog(COMMON_DIALOG_KEYS.EMAIL_TEMPLATE, props);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await API.email.templates.remove(id);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      // Fetch full template data including content
      const fullTemplate = await API.email.templates.getById(template.id);
      setPreviewTemplate(fullTemplate);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Failed to fetch template for preview:", error);
    }
  };

  const handleTestEmail = async (template: EmailTemplate) => {
    try {
      // Get default email provider
      const providers = await API.email.providers.list();
      const defaultProvider = providers.find(p => p.isDefault && p.isActive);

      if (!defaultProvider) {
        alert("No default email provider found. Please configure a default email provider first.");
        return;
      }

      // Open test email dialog
      openDialog(COMMON_DIALOG_KEYS.TEST_EMAIL, {
        providerId: defaultProvider.id,
        providerName: defaultProvider.name,
        onTestEmail: async (providerId: string, email: string) => {
          // Send template email via API
          const result = await API.email.templates.sendTest(template.id, email, providerId, {});
          return {
            success: result.success || true,
            connectionValid: true,
            emailSent: result.success || true,
            messageId: result.messageId,
            error: result.error,
          };
        },
        onSuccess: result => {
          alert(
            `✅ Test email sent successfully!\n\nMessage ID: ${result.messageId || "N/A"}\n\nPlease check your inbox at ${result.email}`
          );
        },
      });
    } catch (error) {
      console.error("Failed to send test email:", error);
      alert(`Failed to send test email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleEditDesign = async (template: EmailTemplate) => {
    try {
      // Fetch full template data including design
      const fullTemplate = await API.email.templates.getById(template.id);
      const templateType = getTemplateType(fullTemplate);

      // Use the editor sheet which supports all template types
      openDialog(COMMON_DIALOG_KEYS.EMAIL_TEMPLATE_EDITOR_SHEET, {
        templateType,
        initialDesign: fullTemplate.design || undefined,
        initialHtml: fullTemplate.html || undefined,
        initialText: fullTemplate.text || undefined,
        onSave: async (data: { design?: string; html?: string; text?: string; templateType: EmailTemplateType }) => {
          // Prepare update data based on template type
          const updateData: {
            design?: string;
            html?: string;
            text?: string;
            templateType?: EmailTemplateType;
          } = {};

          if (data.templateType === EmailTemplateType.UNLAYER && data.design) {
            updateData.design = data.design;
            updateData.html = data.html;
            // Clear other types
            updateData.text = undefined;
          } else if (data.templateType === EmailTemplateType.HTML && data.html) {
            updateData.html = data.html;
            // Clear other types
            updateData.design = undefined;
            updateData.text = undefined;
          } else if (data.templateType === EmailTemplateType.TEXT && data.text) {
            updateData.text = data.text;
            // Clear other types
            updateData.design = undefined;
            updateData.html = undefined;
          }

          await API.email.templates.update(template.id, updateData);
          setRefreshCounter(prev => prev + 1);
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch template for design editing:", error);
    }
  };

  const getTemplateType = (template: EmailTemplate): EmailTemplateType => {
    if (template.design) return EmailTemplateType.UNLAYER;
    if (template.html && template.html.trim()) return EmailTemplateType.HTML;
    if (template.text && template.text.trim()) return EmailTemplateType.TEXT;
    return EmailTemplateType.HTML; // Default
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <FileText className="h-5 w-5" />
              Email Templates
            </h1>
            <p className="text-muted-foreground mt-1">Manage email templates and their content</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No templates found. Create your first template to get started.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{template.slug}</code>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(template)} title="Preview">
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDesign(template)}
                          title="Edit Design"
                        >
                          <Palette className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="sm" onClick={() => handleTestEmail(template)} title="Test Email">
                          <Mail className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="sm" onClick={() => handleEdit(template)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Preview Sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl lg:max-w-4xl">
          <SheetHeader>
            <SheetTitle>{previewTemplate?.name || "Email Template Preview"}</SheetTitle>
            <SheetDescription>{previewTemplate?.subject && `Subject: ${previewTemplate.subject}`}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {previewTemplate && (
              <>
                {(getTemplateType(previewTemplate) === EmailTemplateType.UNLAYER ||
                  getTemplateType(previewTemplate) === EmailTemplateType.HTML) &&
                  previewTemplate.html && (
                    <div className="space-y-2">
                      <div className="bg-muted/50 rounded-md border p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="text-sm font-medium">
                            {getTemplateType(previewTemplate) === EmailTemplateType.UNLAYER
                              ? "Unlayer Design Preview"
                              : "HTML Preview"}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getTemplateType(previewTemplate) === EmailTemplateType.UNLAYER ? "Design" : "HTML"}
                          </Badge>
                        </div>
                        <div className="rounded border bg-white p-4 shadow-sm">
                          <div
                            className="email-preview-container max-w-full overflow-auto"
                            style={{ maxHeight: "70vh" }}
                            dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                {getTemplateType(previewTemplate) === EmailTemplateType.TEXT && previewTemplate.text && (
                  <div className="space-y-2">
                    <div className="bg-muted/50 rounded-md border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-medium">Plain Text Preview</div>
                        <Badge variant="outline" className="text-xs">
                          Text
                        </Badge>
                      </div>
                      <div className="rounded border bg-white p-4 shadow-sm">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {previewTemplate.text}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {!previewTemplate.html && !previewTemplate.text && !previewTemplate.design && (
                  <div className="text-muted-foreground py-8 text-center">
                    No content available for preview. Please edit the template to add content.
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EmailTemplatesPage;
