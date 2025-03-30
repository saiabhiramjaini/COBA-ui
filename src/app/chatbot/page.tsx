"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  FileUp,
  Bot,
  User,
  X,
  FileText,
  Loader2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Loading } from "@/components/loading";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
};

// API endpoints (replace with your actual endpoints)
const TEXT_API_URL = "/api/analyze-text";
const DOCUMENT_API_URL = "/api/analyze-document";

export default function Summarization() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          content:
            "👋 Hello! I'm C.O.B.A Upload a document OR paste text to get started.",
          role: "assistant",
        },
      ]);
    }
  }, []);

  const analyzeText = async (text: string) => {
    try {
      const response = await axios.post(TEXT_API_URL, { text });
      return response.data.summary;
    } catch (error) {
      console.error("Error analyzing text:", error);
      return "Sorry, I couldn't analyze that text. Please try again.";
    }
  };

  const analyzeDocument = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(DOCUMENT_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.summary;
    } catch (error) {
      console.error("Error analyzing document:", error);
      return "Sorry, I couldn't analyze that document. Please try again.";
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      attachments: uploadedFile
        ? [
            {
              name: uploadedFile.name,
              size: formatFileSize(uploadedFile.size),
              type: uploadedFile.type,
            },
          ]
        : undefined,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      let analysisResult: string;
      
      if (uploadedFile) {
        analysisResult = await analyzeDocument(uploadedFile);
      } else {
        analysisResult = await analyzeText(input);
      }

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
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setUploadedFile(file);
      setInput(""); // Clear text input when file is uploaded
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (uploadedFile && e.target.value) {
      // If user starts typing, remove the uploaded file
      removeUploadedFile();
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
                        {message.attachments?.map((attachment, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg mb-2",
                              message.role === "assistant"
                                ? "bg-background"
                                : "bg-primary-foreground/10"
                            )}
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {attachment.name}
                              </p>
                              <p className="text-xs opacity-70">
                                {attachment.size}
                              </p>
                            </div>
                          </div>
                        ))}
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
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 p-2 pr-3 bg-muted rounded-lg text-sm"
              >
                <div className="bg-primary/10 p-1.5 rounded-md">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium truncate flex-1">
                  {uploadedFile.name}
                </span>
                <span className="text-muted-foreground">
                  {formatFileSize(uploadedFile.size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={removeUploadedFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder={
                    uploadedFile 
                      ? "Press send to analyze the document" 
                      : "Paste text to analyze..."
                  }
                  value={input}
                  onChange={handleTextInputChange}
                  onKeyDown={handleKeyDown}
                  className="min-h-[56px] max-h-[200px] pr-12 resize-none"
                  disabled={!!uploadedFile}
                />
                <div className="absolute right-2 bottom-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!!input.trim()}
                        >
                          <FileUp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {input.trim() ? "Clear text to upload file" : "Upload document"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  disabled={!!input.trim()}
                />
              </div>

              <Button
                size="icon"
                className="h-[56px] w-[56px] rounded-full"
                onClick={handleSendMessage}
                disabled={(!input.trim() && !uploadedFile) || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Supports PDF, DOC, TXT (Max 10MB)</span>
              </div>
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

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}