"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileUp,
  Bot,
  Trash2,
  FileText,
  Loader2,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

// API endpoints
const TEXT_API_URL = "/api/analyze-text";
const DOCUMENT_API_URL = "/api/analyze-document";

export default function Summarization() {
  const [input, setInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    setIsLoading(true);

    try {
      let result;
      if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        const response = await axios.post(DOCUMENT_API_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        result = response.data.summary;
      } else {
        const response = await axios.post(TEXT_API_URL, { text: input });
        result = response.data.summary;
      }

      setSummary(result);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary(
        "Sorry, something went wrong while generating the summary. Please try again."
      );
    } finally {
      setIsLoading(false);
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
      setInput(""); // Clear text input when file is selected
    }
  };

  const clearInputs = () => {
    setInput("");
    setUploadedFile(null);
    setSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-background">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {!summary ? (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <Card className="w-full max-w-3xl p-6 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Input your content</h2>
                  <p className="text-sm text-muted-foreground">
                    Paste your text or upload a document to generate a summary
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Text input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Text Input</label>
                    <Textarea
                      ref={textareaRef}
                      placeholder="Paste your text here..."
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (uploadedFile) {
                          setUploadedFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }
                      }}
                      className="min-h-[120px]"
                    />
                  </div>

                  {/* File upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Or upload a document
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        {uploadedFile ? "Change File" : "Select File"}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      {uploadedFile && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          <span className="truncate max-w-[180px]">
                            {uploadedFile.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={removeUploadedFile}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supports PDF, DOC, TXT (Max 10MB)
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={(!input.trim() && !uploadedFile) || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Generate Summary"
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="h-full p-6">
              <div className="max-w-3xl mx-auto h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Summary</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearInputs}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      New Summary
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <Card className="flex-1 p-6 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}
