"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Loader2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";

// API endpoint
const TEXT_API_URL = "/api/analyze-sentiment";

export default function SentimentalAnalysis() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
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
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const response = await axios.post(TEXT_API_URL, { text: input });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      setAnalysis(
        "Sorry, something went wrong while analyzing the text. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearInput = () => {
    setInput("");
    setAnalysis(null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-background">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {!analysis ? (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <Card className="w-full max-w-3xl p-6 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Input your text</h2>
                  <p className="text-sm text-muted-foreground">
                    Paste your text to analyze its sentiment
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
                      onChange={(e) => setInput(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Sentiment"
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="h-full p-6">
              <div className="max-w-3xl mx-auto h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Sentiment Analysis</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearInput}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      New Analysis
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <Card className="flex-1 p-6 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="prose max-w-none">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
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
