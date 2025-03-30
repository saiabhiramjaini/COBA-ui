"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Loading } from "@/components/loading";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
};

// API endpoint (replace with your actual endpoint)
const TEXT_API_URL = "/api/analyze-text";

export default function TextChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && scrollAreaViewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaViewportRef.current;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          content: "👋 Hello! I'm your text analysis assistant. Paste or type text to analyze.",
          role: "assistant",
        },
      ]);
    }
  }, []);

  const analyzeText = async (text: string) => {
    try {
      const response = await axios.post(TEXT_API_URL, { text });
      return response.data.analysis;
    } catch (error) {
      console.error("Error analyzing text:", error);
      return "Sorry, I couldn't analyze that text. Please try again.";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const analysisResult = await analyzeText(input);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: analysisResult,
        role: "assistant",
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, something went wrong. Please try again.",
        role: "assistant",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-background">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Area */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div 
            ref={scrollAreaViewportRef}
            className="h-full w-full px-4"
          >
            <div className="max-w-3xl mx-auto py-6 space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "group flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 mt-1">
                        <Bot className="h-5 w-5" />
                      </Avatar>
                    )}

                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 shadow-sm",
                          message.role === "assistant"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      </div>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 mt-1 bg-primary text-primary-foreground flex justify-center items-center">
                        <User className="h-5 w-5" />
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              <AnimatePresence>{isLoading && <Loading />}</AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder="Enter text to analyze..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[56px] max-h-[200px] pr-12 resize-none"
                />
              </div>

              <Button
                size="icon"
                className="h-[56px] w-[56px] rounded-full"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Processing may take a few seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}