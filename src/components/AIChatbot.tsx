import { useState, useRef, useEffect } from "react";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  Sparkles,
  Target,
  CheckSquare,
  ListChecks,
  Paperclip,
  FileText,
} from "lucide-react";

function ActionBadge({ action }: { action: { type: string; data: any } }) {
  const config: Record<string, { icon: any; label: string; color: string }> = {
    createGoal: { icon: Target, label: "Goal created", color: "text-indigo-400" },
    createTask: { icon: CheckSquare, label: "Task created", color: "text-emerald-400" },
    createPlan: {
      icon: ListChecks,
      label: `Plan created • ${action.data?.tasks?.length || 0} tasks`,
      color: "text-amber-400",
    },
  };
  const c = config[action.type];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-muted/50 ${c.color}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? "items-end" : ""}`}>
        {/* File attachment badge */}
        {msg.fileName && (
          <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
            <FileText className="w-3 h-3" />
            {msg.fileName}
          </div>
        )}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-md"
              : "bg-muted rounded-tl-md"
          }`}
        >
          {msg.content}
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.actions.map((a, i) => (
              <ActionBadge key={i} action={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AIChatbot() {
  const { messages, isLoading, sendMessage, sendFile, clearChat } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;

    // Pass the current input text as an optional message alongside the file
    sendFile(file, input.trim() || undefined);
    setInput("");

    // Reset the file input so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* ─── Floating Action Button ─── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen
            ? "bg-muted text-foreground rotate-0"
            : "bg-primary text-primary-foreground"
        }`}
        style={{
          boxShadow: isOpen
            ? "0 4px 20px rgba(0,0,0,0.15)"
            : "0 4px 25px hsl(var(--primary) / 0.4)",
        }}
      >
        <div className="relative w-6 h-6">
          <MessageCircle
            className={`w-6 h-6 absolute inset-0 transition-all duration-300 ${
              isOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <X
            className={`w-6 h-6 absolute inset-0 transition-all duration-300 ${
              isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
            }`}
          />
        </div>
      </button>

      {/* ─── Chat Panel ─── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        <Card className="flex flex-col h-[550px] max-h-[70vh] overflow-hidden shadow-2xl border-border/50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">TrackerGoal AI</p>
                <p className="text-[11px] text-muted-foreground">
                  {isLoading ? "Thinking..." : "Powered by Gemini"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearChat} title="Clear chat" className="h-8 w-8">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-muted">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-background">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
              id="chatbot-file-input"
            />
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Upload PDF or image"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or attach a file..."
                rows={1}
                className="flex-1 resize-none bg-muted rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/60 min-h-[40px] max-h-[120px]"
                style={{ fieldSizing: "content" } as any}
              />
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
