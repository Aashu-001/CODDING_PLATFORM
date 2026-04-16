import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, ChevronDown } from 'lucide-react';

const PROVIDERS = [
    {
        id: "groq",
        label: "Groq – Llama 3.3 70B",
        badge: "Fastest",
        badgeColor: "badge-success",
        dot: "bg-green-400",
    },
    {
        id: "gemini",
        label: "Gemini – Flash 2.0",
        badge: "Google",
        badgeColor: "badge-info",
        dot: "bg-blue-400",
    },
    {
        id: "openrouter",
        label: "DeepSeek R1 (Free)",
        badge: "Reasoning",
        badgeColor: "badge-secondary",
        dot: "bg-purple-400",
    },
];

function ChatAi({ problem, editorCode, language }) {
    const [messages, setMessages] = useState([
        { role: 'user', parts: [{ text: "Hello" }] },
        { role: 'model', parts: [{ text: "Hi! I'm your DSA tutor. Ask me anything about the current problem!" }] }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [selectedProvider, setSelectedProvider] = useState("groq");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const pendingPayloadRef = useRef(null);
    const countdownTimerRef = useRef(null);
    const dropdownRef = useRef(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const messagesEndRef = useRef(null);

    const activeProvider = PROVIDERS.find(p => p.id === selectedProvider);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, countdown]);

    // Cleanup timers on unmount
    useEffect(() => () => clearInterval(countdownTimerRef.current), []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const callApi = useCallback(async (payload) => {
        try {
            const response = await axiosClient.post("/ai/chat", payload);
            setMessages(prev => [...prev, {
                role: 'model',
                parts: [{ text: response.data.message }]
            }]);
            setIsLoading(false);
            pendingPayloadRef.current = null;
        } catch (error) {
            const status = error?.response?.status;
            const retryAfter = error?.response?.data?.retryAfter;

            const quotaExhausted = error?.response?.data?.quotaExhausted;

            if (status === 429 && quotaExhausted) {
                // Billing quota exhausted — auto-retry will NEVER work, stop immediately
                console.warn("Quota exhausted. Stopping retries.");
                setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: error?.response?.data?.message || "⚠️ Quota exhausted. Please switch to a different AI model." }]
                }]);
                setIsLoading(false);
                pendingPayloadRef.current = null;
            } else if (status === 429 && retryAfter) {
                console.log(`Rate limited. Retrying in ${retryAfter}s`);
                setCountdown(retryAfter);
                pendingPayloadRef.current = payload;

                countdownTimerRef.current = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownTimerRef.current);
                            callApi(pendingPayloadRef.current);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                console.error("API Error:", error?.response?.data || error.message);
                setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: "Sorry, I encountered an error. Please try again or switch to a different AI model." }]
                }]);
                setIsLoading(false);
                pendingPayloadRef.current = null;
            }
        }
    }, []);

    const onSubmit = async (data) => {
        if (isLoading) return;

        clearInterval(countdownTimerRef.current);
        setCountdown(0);

        const newUserMessage = { role: 'user', parts: [{ text: data.message }] };
        const updatedMessages = [...messages, newUserMessage];

        setMessages(updatedMessages);
        reset();
        setIsLoading(true);

        const payload = {
            messages: updatedMessages,
            title: problem.title,
            description: problem.description,
            testCases: problem.visibleTestCases,
            startCode: problem.startCode,
            provider: selectedProvider,
            editorCode: editorCode || '',
            language: language || 'javascript',
        };

        await callApi(payload);
    };

    return (
        <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px]">

            {/* ── Provider selector header ── */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-base-200">
                <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">AI Model</span>

                {/* Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(o => !o)}
                        className="flex items-center gap-2 btn btn-sm btn-ghost border border-base-300"
                    >
                        <span className={`w-2 h-2 rounded-full ${activeProvider.dot}`} />
                        <span className="text-sm font-medium">{activeProvider.label}</span>
                        <span className={`badge badge-xs ${activeProvider.badgeColor}`}>{activeProvider.badge}</span>
                        <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownOpen && (
                        <ul className="absolute right-0 mt-1 z-50 menu menu-sm bg-base-100 border border-base-300 rounded-box shadow-lg w-64 p-1">
                            {PROVIDERS.map(p => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedProvider(p.id); setDropdownOpen(false); }}
                                        className={`flex items-center gap-2 ${selectedProvider === p.id ? "active" : ""}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                        <span className="flex-1 text-left text-sm">{p.label}</span>
                                        <span className={`badge badge-xs ${p.badgeColor}`}>{p.badge}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
                    >
                        <div className="chat-bubble bg-base-200 text-base-content whitespace-pre-wrap">
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}

                {/* Loading / countdown indicator */}
                {isLoading && (
                    <div className="chat chat-start">
                        <div className="chat-bubble bg-base-200 text-base-content">
                            {countdown > 0 ? (
                                <span className="flex items-center gap-2">
                                    ⏳ Rate limit hit. Auto-retrying in <strong>{countdown}s</strong>…
                                </span>
                            ) : (
                                <span className="loading loading-dots loading-sm"></span>
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Input form ── */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="sticky bottom-0 p-4 bg-base-100 border-t"
            >
                <div className="flex items-center gap-2">
                    <input
                        placeholder="Ask me anything about this problem…"
                        className="input input-bordered flex-1"
                        {...register("message", { required: true, minLength: 2 })}
                    />
                    <button
                        type="submit"
                        className="btn btn-ghost"
                        disabled={!!errors.message || isLoading}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChatAi;
