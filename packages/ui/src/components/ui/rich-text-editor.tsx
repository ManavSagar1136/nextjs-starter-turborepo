"use client";

/**
 * RichTextEditor: A customizable rich text (WYSIWYG) editor component for React.
 * Provides formatting, emoji, file attachment, mention support, and send features.
 *
 * @module RichTextEditor
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Loader2, Paperclip, Send, Smile, Strikethrough, Underline, type LucideIcon } from "lucide-react";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

import { cn } from "../../lib/utils";

/**
 * A default set of commonly used emojis for emoji picker.
 * @internal
 */
const DEFAULT_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "🎉",
  "✅",
  "❌",
  "⭐",
];

/**
 * An interface describing a button in the RichTextEditor's toolbar.
 */
export interface RichTextEditorToolbarButton {
  /** The Lucide icon component for the button. */
  icon: LucideIcon;
  /** The formatting command to run via document.execCommand. */
  command: string;
  /** Human-readable title for accessible tooltips. */
  title: string;
  /** Optional keyboard shortcut string (e.g. "Ctrl+B"). */
  keyboardShortcut?: string;
}

/**
 * Props for the RichTextEditor component.
 */
export interface RichTextEditorProps {
  /** Editor value as plain text. */
  value: string;
  /**
   * On change handler for the editor.
   * @param value - The updated plain text content.
   * @param html - The updated HTML content.
   */
  onChange: (value: string, html?: string) => void;
  /**
   * Optionally handle keydown events on the contentEditable.
   * @param e
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Placeholder text displayed when editor is empty. */
  placeholder?: string;
  /** Additional className for the root editor container. */
  className?: string;
  /** Whether the editor is disabled. */
  disabled?: boolean;

  // HTML content
  /** Initial HTML content for the editor. */
  htmlValue?: string;
  /** Callback when the HTML content changes. */
  onHtmlChange?: (html: string) => void;

  // Toolbar customization
  /** Whether to show the toolbar. */
  showToolbar?: boolean;
  /** Whether to show formatting buttons (Bold, Italic, etc.). */
  showFormattingButtons?: boolean;
  /** Show bold button (default: true). */
  showBold?: boolean;
  /** Show italic button (default: true). */
  showItalic?: boolean;
  /** Show underline button (default: true). */
  showUnderline?: boolean;
  /** Show strikethrough button (default: true). */
  showStrikethrough?: boolean;
  /** Show emoji picker button (default: true). */
  showEmoji?: boolean;
  /** Show attach file button (default: false). */
  showAttachFile?: boolean;
  /** Custom toolbar formatting buttons. */
  customToolbarButtons?: RichTextEditorToolbarButton[];
  /** Additional className for toolbar container. */
  toolbarClassName?: string;

  // Emoji customization
  /** Array of emoji selector options. */
  emojis?: string[];
  /** Custom className for emoji popover. */
  emojiPopoverClassName?: string;

  // Mention support
  /**
   * Callback triggered when user types "@", for mention/autocomplete support.
   * @param query - The current text after "@".
   * @param startIndex - The index of "@" in the input.
   */
  onMentionTrigger?: (query: string, startIndex: number) => void;

  // File attachment
  /**
   * Callback for when the attach file button is clicked.
   */
  onAttachFile?: () => void;
  /** Override label for attach file button tooltip. */
  attachFileTitle?: string;

  // Send button
  /**
   * Callback for when the send button is clicked.
   */
  onSend?: () => void;
  /** Whether sending is allowed (and thus send button is enabled). */
  canSend?: boolean;
  /** True if sending is in progress (shows spinner). */
  isSending?: boolean;
  /** Send button label. */
  sendButtonLabel?: string;
  /** Additional className for send button. */
  sendButtonClassName?: string;

  // Editor customization
  /** Additional className for the inner editor (contentEditable) element. */
  editorClassName?: string;
  /** Minimum height for the editor area (CSS value). */
  minHeight?: string;
  /** Maximum height for the editor area (CSS value). */
  maxHeight?: string;
  /** Whether to auto-focus the editor on mount. */
  autoFocus?: boolean;

  // Paste handling
  /**
   * Whether to strip formatting on paste (forces plain text). Default: true.
   */
  stripPasteFormatting?: boolean;

  // Formatting shortcuts
  /**
   * Enables common formatting keyboard shortcuts (bold, italic, underline). Default: true.
   */
  enableFormattingShortcuts?: boolean;
}

/**
 * RichTextEditor is a customizable, accessible rich text editor with support for formatting,
 * emoji, file attachment, mentions, and more.
 *
 * @param props - RichTextEditorProps
 * @returns React.FC
 * @public
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder = "Type a message...",
  className,
  disabled = false,
  htmlValue,
  onHtmlChange,
  showToolbar = true,
  showFormattingButtons = true,
  showBold = true,
  showItalic = true,
  showUnderline = true,
  showStrikethrough = true,
  showEmoji = true,
  showAttachFile = false,
  customToolbarButtons = [],
  toolbarClassName,
  emojis = DEFAULT_EMOJIS,
  emojiPopoverClassName,
  onMentionTrigger,
  onAttachFile,
  attachFileTitle = "Attach file",
  onSend,
  canSend = false,
  isSending = false,
  sendButtonLabel = "Send",
  sendButtonClassName,
  editorClassName,
  minHeight = "60px",
  maxHeight = "200px",
  autoFocus = false,
  stripPasteFormatting = true,
  enableFormattingShortcuts = true,
}) => {
  /**
   * contentEditable ref (HTMLDivElement)
   */
  const editorRef = useRef<HTMLDivElement>(null);
  /**
   * Whether emoji picker is open.
   */
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  /**
   * Internal ref for last known plain text value (to avoid unnecessary updates).
   */
  const lastValueRef = useRef<string>("");
  /**
   * Used to detect initial mount for controlled value/html sync.
   */
  const isInitialMountRef = useRef(true);

  /**
   * Set HTML editor value when htmlValue changes,
   * but only if editor is not focused or this is the initial mount.
   */
  useEffect(() => {
    if (htmlValue && editorRef.current) {
      const editorElement = editorRef.current.querySelector('[contenteditable="true"]') as HTMLElement | null;
      if (editorElement && htmlValue.trim()) {
        const isFocused = document.activeElement === editorElement;
        if (isInitialMountRef.current || !isFocused) {
          editorElement.innerHTML = htmlValue;
          lastValueRef.current = editorElement.textContent || "";
          isInitialMountRef.current = false;
        }
      }
    }
  }, [htmlValue]);

  /**
   * Updates the editor content when value changes from outside props.
   * Skips update if user is actively typing (focused) to prevent clobbering formatting.
   */
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      const currentText = editorRef.current.textContent || "";
      const isFocused = document.activeElement === editorRef.current;

      if (currentText !== value && !isFocused) {
        editorRef.current.textContent = value;
        lastValueRef.current = value;
      }
    }
  }, [value]);

  /**
   * Auto-focus editor contentEditable on mount if autoFocus is set.
   */
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      const editorElement = editorRef.current.querySelector('[contenteditable="true"]') as HTMLElement | null;
      editorElement?.focus();
    }
  }, [autoFocus]);

  /**
   * Return text and offset before cursor in contentEditable.
   * Useful for handling mentions/autocomplete features.
   */
  const getTextBeforeCursor = useCallback((): {
    text: string;
    offset: number;
  } => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) {
      return { text: "", offset: 0 };
    }

    const range = selection.getRangeAt(0);

    // Create a range from start of editor to cursor
    const textRange = document.createRange();
    textRange.setStart(editorRef.current, 0);
    textRange.setEnd(range.startContainer, range.startOffset);

    const textBefore = textRange.toString();
    return { text: textBefore, offset: textBefore.length };
  }, []);

  /**
   * On contentEditable input: update value, call mention handler, fire HTML changes.
   */
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || "";
      const html = editorRef.current.innerHTML || "";

      // Check for @mention trigger
      if (onMentionTrigger) {
        const { text: textBeforeCursor } = getTextBeforeCursor();
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
          const query = mentionMatch[1];
          const startIndex = textBeforeCursor.length - query.length - 1;
          onMentionTrigger(query, startIndex);
        }
      }

      lastValueRef.current = text;
      onChange(text, html);
      onHtmlChange?.(html);
    }
  }, [onChange, onHtmlChange, onMentionTrigger, getTextBeforeCursor]);

  /**
   * On paste in contentEditable, optionally strip formatting to force plain text.
   *
   * @param e - React clipboard event
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (stripPasteFormatting) {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }
    },
    [stripPasteFormatting]
  );

  /**
   * Formats selected text using the built-in execCommand API.
   *
   * @param command - e.g., "bold", "italic"
   * @param value - optional parameter for some commands
   */
  const formatText = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      handleInput();
    },
    [handleInput]
  );

  /**
   * Inserts text at current cursor/caret position in contentEditable.
   * @param textToInsert - The string to insert
   */
  const insertTextAtCursor = useCallback(
    (textToInsert: string) => {
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(textToInsert);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          document.execCommand("insertText", false, textToInsert);
        }
        editorRef.current.focus();
        handleInput();
      }
    },
    [handleInput]
  );

  /**
   * Inserts an emoji character at the caret position.
   * @param emoji - Unicode emoji string
   */
  const insertEmoji = useCallback(
    (emoji: string) => {
      insertTextAtCursor(emoji);
      setIsEmojiOpen(false);
    },
    [insertTextAtCursor]
  );

  /**
   * Exposes the insertTextAtCursor utility via ref on the root editor div.
   * Allows parent components to imperatively insert text (for mentions, etc).
   */
  useEffect(() => {
    if (editorRef.current) {
      interface HTMLElementWithInsertText extends HTMLElement {
        insertTextAtCursor?: (text: string) => void;
      }
      (editorRef.current as HTMLElementWithInsertText).insertTextAtCursor = insertTextAtCursor;
    }
  }, [insertTextAtCursor]);

  /**
   * Handles keydown for keyboard shortcuts (bold, italic, underline).
   *
   * @param e - Keyboard event from contentEditable
   */
  const handleKeyDownInternal = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle formatting shortcuts if enabled
      if (enableFormattingShortcuts) {
        // Handle Ctrl/Cmd + B for bold
        if ((e.ctrlKey || e.metaKey) && e.key === "b") {
          e.preventDefault();
          formatText("bold");
          return;
        }
        // Handle Ctrl/Cmd + I for italic
        if ((e.ctrlKey || e.metaKey) && e.key === "i") {
          e.preventDefault();
          formatText("italic");
          return;
        }
        // Handle Ctrl/Cmd + U for underline
        if ((e.ctrlKey || e.metaKey) && e.key === "u") {
          e.preventDefault();
          formatText("underline");
          return;
        }
      }
      // Call external handler
      onKeyDown?.(e);
    },
    [onKeyDown, formatText, enableFormattingShortcuts]
  );

  /**
   * Determines if toolbar should be shown based on props/content.
   */
  const hasToolbarContent =
    showToolbar && (showFormattingButtons || showAttachFile || showEmoji || customToolbarButtons.length > 0 || onSend);

  return (
    <div className={cn("bg-background text-foreground flex flex-col rounded-lg border", className)}>
      {/* Toolbar */}
      {hasToolbarContent && (
        <div className={cn("flex items-center justify-between gap-1 border-b px-2 py-1", toolbarClassName)}>
          {/* Left side: Formatting tools */}
          <div className="flex items-center gap-1">
            {showFormattingButtons && (
              <>
                {showBold && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => formatText("bold")}
                    disabled={disabled}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                )}
                {showItalic && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => formatText("italic")}
                    disabled={disabled}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                )}
                {showUnderline && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => formatText("underline")}
                    disabled={disabled}
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                )}
                {showStrikethrough && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => formatText("strikeThrough")}
                    disabled={disabled}
                    title="Strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                )}
                {(showBold || showItalic || showUnderline || showStrikethrough || customToolbarButtons.length > 0) &&
                  (showAttachFile || showEmoji) && <div className="bg-border mx-1 h-4 w-px" />}
              </>
            )}

            {/* Custom toolbar buttons */}
            {customToolbarButtons.map((button, index) => {
              const Icon = button.icon;
              return (
                <Button
                  key={`custom-${index}`}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => formatText(button.command)}
                  disabled={disabled}
                  title={button.keyboardShortcut ? `${button.title} (${button.keyboardShortcut})` : button.title}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}

            {showAttachFile && onAttachFile && (
              <>
                {customToolbarButtons.length > 0 && <div className="bg-border mx-1 h-4 w-px" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onAttachFile}
                  disabled={disabled}
                  title={attachFileTitle}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </>
            )}

            {showEmoji && (
              <>
                {(showAttachFile || customToolbarButtons.length > 0) && <div className="bg-border mx-1 h-4 w-px" />}
                <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={disabled}
                      title="Insert emoji"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={cn("w-64 p-2", emojiPopoverClassName)} align="start">
                    <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
                      {emojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="hover:bg-accent rounded p-1 text-lg transition-colors"
                          onClick={() => insertEmoji(emoji)}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>

          {/* Right side: Send button */}
          {onSend && (
            <Button
              type="button"
              size="sm"
              onClick={onSend}
              disabled={!canSend || disabled || isSending}
              className={cn("h-7 px-3", sendButtonClassName)}
              aria-label={isSending ? "Sending..." : sendButtonLabel}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs font-medium">Sending</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{sendButtonLabel}</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDownInternal}
        className={cn(
          "overflow-y-auto px-3 py-2",
          "focus:outline-none focus:ring-0",
          "text-sm",
          "whitespace-pre-wrap break-words",
          disabled && "cursor-not-allowed opacity-50",
          editorClassName
        )}
        style={{
          minHeight,
          maxHeight,
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `,
        }}
      />
    </div>
  );
};
