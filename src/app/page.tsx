"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";

// Definisikan tipe untuk pesan
interface Message {
  role: "user" | "model";
  content: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efek untuk memuat riwayat dari localStorage saat pertama kali
  useEffect(() => {
    const savedConversation = localStorage.getItem("chat_history");
    if (savedConversation) {
      setConversation(JSON.parse(savedConversation));
    }
  }, []);

  // Efek untuk menyimpan riwayat dan menggulir ke bawah setiap kali ada perubahan
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(conversation));
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const userMessage: Message = { role: "user", content: input };

    setConversation((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: [...conversation, userMessage] }),
      });

      if (!response.ok) {
        throw new Error("Gagal berkomunikasi dengan API");
      }

      const data = await response.json();
      const modelMessage: Message = { role: "model", content: data.text };

      setConversation((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "model",
        content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
      };
      setConversation((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem("chat_history");
    setConversation([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-3xl w-full h-[90vh] flex flex-col bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl md:text-2xl font-semibold">Asisten AI</h1>
            {conversation.length > 0 && (
              <button
                onClick={handleClear}
                className="text-sm md:text-base text-gray-500 hover:text-red-500 transition-colors"
              >
                Hapus Riwayat
              </button>
            )}
          </div>

          {/* Chat Container yang bisa digulir */}
          <div className="prose flex-grow overflow-y-auto p-4 md:p-6 space-y-4 smooth-scroll-hidden-scrollbar">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] p-3 rounded-lg shadow-md ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={dracula}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="flex-shrink-0 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tuliskan pertanyaan Anda di sini..."
                rows={1}
                className="flex-grow resize-y overflow-y-auto p-3 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || input.trim() === ""}
                className={`
                p-3 rounded-full font-semibold transition-colors duration-200 flex-shrink-0 flex items-center justify-center
                ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }
              `}
              >
                <svg
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isLoading ? "text-gray-600" : "text-white"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M14.072 12L8.14 6.068a.75.75 0 011.06-1.06L15.65 11.47a.75.75 0 010 1.06L9.202 18.992a.75.75 0 01-1.06-1.06L14.072 12z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
