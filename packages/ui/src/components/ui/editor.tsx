import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

export interface EditorProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Editor = React.forwardRef<HTMLTextAreaElement, EditorProps>(
  ({ className, value = "", onChange, placeholder = "Start writing...", ...props }, ref) => {
    const [content, setContent] = React.useState(value);

    React.useEffect(() => {
      setContent(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setContent(newValue);
      onChange?.(newValue);
    };

    const insertText = (before: string, after: string = "") => {
      const textarea = ref as React.RefObject<HTMLTextAreaElement>;
      if (!textarea?.current) return;

      const start = textarea.current.selectionStart;
      const end = textarea.current.selectionEnd;
      const selectedText = content.substring(start, end);
      const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

      setContent(newText);
      onChange?.(newText);

      // Restore cursor position
      setTimeout(() => {
        if (textarea.current) {
          textarea.current.focus();
          textarea.current.setSelectionRange(start + before.length, end + before.length);
        }
      }, 0);
    };

    const toolbarButtons = [
      { icon: Bold, action: () => insertText("**", "**"), title: "Bold" },
      { icon: Italic, action: () => insertText("*", "*"), title: "Italic" },
      {
        icon: Underline,
        action: () => insertText("<u>", "</u>"),
        title: "Underline",
      },
      {
        icon: Strikethrough,
        action: () => insertText("~~", "~~"),
        title: "Strikethrough",
      },
      { icon: Code, action: () => insertText("`", "`"), title: "Code" },
      { icon: Quote, action: () => insertText("> ", ""), title: "Quote" },
      { icon: List, action: () => insertText("- ", ""), title: "Bullet List" },
      {
        icon: ListOrdered,
        action: () => insertText("1. ", ""),
        title: "Numbered List",
      },
      { icon: Link, action: () => insertText("[", "](url)"), title: "Link" },
      {
        icon: Image,
        action: () => insertText("![", "](image-url)"),
        title: "Image",
      },
    ];

    return (
      <div className={cn("rounded-lg border", className)}>
        <div className="flex items-center gap-1 border-b p-2">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.title}
              className="h-8 w-8 p-0"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <textarea
          ref={ref}
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          className="min-h-[200px] w-full resize-none border-0 p-4 focus:ring-0 focus:outline-none"
          {...props}
        />
      </div>
    );
  }
);
Editor.displayName = "Editor";
