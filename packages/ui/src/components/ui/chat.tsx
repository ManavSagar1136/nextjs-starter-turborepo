import * as React from "react";
import { Send, Bot, User, MoreVertical } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { ScrollArea } from "./scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  avatar?: string;
  name?: string;
}

export interface ChatProps {
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onClearChat?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
}

export function Chat({
  messages,
  onSendMessage,
  onClearChat,
  placeholder = "Type a message...",
  className,
  disabled = false,
  maxHeight = "400px",
}: ChatProps) {
  const [inputValue, setInputValue] = React.useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return;

    onSendMessage?.(inputValue.trim());
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className={cn("flex flex-col rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold">Chat</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onClearChat}>Clear Chat</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1" style={{ maxHeight }}>
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Start a conversation</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.avatar} />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="mt-1 text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</p>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.avatar} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!inputValue.trim() || disabled} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
