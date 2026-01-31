"use client";

import React, { useEffect, useRef, useState } from "react";
import { Code, Loader2, Save } from "lucide-react";
import EmailEditor, { type EditorRef } from "react-email-editor";
import { Button } from "@buildbase/ui/components/ui/button";
import { useToast } from "@buildbase/ui/hooks/use-toast";

export interface UnlayerEditorProps {
  /**
   * Initial design JSON (from Unlayer)
   */
  initialDesign?: string | Record<string, unknown>;
  /**
   * Initial HTML content (if not using design)
   */
  initialHtml?: string;
  /**
   * Callback when design is saved
   * @param design - The Unlayer design JSON
   * @param html - The exported HTML
   */
  onSave: (design: string, html: string) => void;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Minimum height for the editor
   */
  minHeight?: string;
}

/**
 * Unlayer Email Editor Component
 * Visual drag-and-drop email template editor
 */
export function UnlayerEditor({
  initialDesign,
  initialHtml,
  onSave,
  isLoading = false,
  minHeight = "600px",
}: UnlayerEditorProps) {
  const emailEditorRef = useRef<EditorRef | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Load initial design when editor is ready
  useEffect(() => {
    if (isEditorReady && emailEditorRef.current?.editor) {
      try {
        if (initialDesign) {
          // If initialDesign is a string (JSON), parse it
          const design = typeof initialDesign === "string" ? JSON.parse(initialDesign) : initialDesign;

          emailEditorRef.current.editor.loadDesign(design);
        }
        // Note: Unlayer editor doesn't support loading HTML directly
        // If only HTML is provided without design, the editor will start empty
      } catch (error) {
        console.error("Error loading design:", error);
        toast({
          title: "Error loading template",
          description: "The template design could not be loaded.",
          variant: "destructive",
        });
      }
    }
  }, [isEditorReady, initialDesign, toast]);

  const handleEditorReady = () => {
    setIsEditorReady(true);
  };

  const handleSave = () => {
    if (!emailEditorRef.current?.editor) {
      return;
    }

    setIsExporting(true);
    // Export HTML and design
    emailEditorRef.current.editor.exportHtml((data: { html: string; design: Record<string, unknown> }) => {
      const { html, design } = data;
      // Convert design to JSON string for storage
      const designJson = JSON.stringify(design);
      onSave(designJson, html);
      setIsExporting(false);
    });
  };

  const handleExportHtml = () => {
    if (!emailEditorRef.current?.editor) {
      return;
    }

    emailEditorRef.current.editor.exportHtml((data: { html: string }) => {
      const { html } = data;
      navigator.clipboard.writeText(html);
      toast({
        title: "HTML copied to clipboard",
        description: "The HTML code has been copied to your clipboard.",
      });
    });
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportHtml}
            disabled={!isEditorReady || isExporting || isLoading}
          >
            <Code className="mr-2 h-4 w-4" />
            Copy HTML
          </Button>
        </div>
        <Button type="button" onClick={handleSave} disabled={!isEditorReady || isExporting || isLoading}>
          {isExporting || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Design
            </>
          )}
        </Button>
      </div>

      <div className="relative w-full overflow-hidden" style={{ minHeight, maxHeight: "70vh" }}>
        {!isEditorReady && (
          <div className="bg-muted/50 absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="text-muted-foreground mx-auto mb-2 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading editor...</p>
            </div>
          </div>
        )}
        <EmailEditor
          ref={emailEditorRef}
          onReady={handleEditorReady}
          minHeight={minHeight}
          options={{
            customCSS: [`body { font-family: 'Inter', sans-serif; }`],
            features: {
              imageEditor: true,
              textEditor: {
                tables: true,
                emojis: true,
              },
            },
            tools: {
              image: {
                enabled: true,
              },
            },
            appearance: {
              theme: "light",
              panels: {
                tools: {
                  dock: "left",
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export default UnlayerEditor;
