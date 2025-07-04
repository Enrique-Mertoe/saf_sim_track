"use client"
import React, {useEffect, useRef, useState} from 'react';
import {Bot, Loader2, Maximize2, Minimize2, RotateCcw, Send, User, X} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UserTable from '@/ui/components/display/UserTable';
import TeamCards from '@/ui/components/display/TeamCards';
import StatsGrid from '@/ui/components/display/StatsGrid';
import {useRouter} from "next/navigation";
import Signal from "@/lib/Signal";

interface Directive {
    name: string;
    type: 'fetch' | 'display' | 'navigate' | 'execute' | 'automate';
    caption: string;
    operation?: string;
    displayComponent?: string;
    params?: Record<string, any>;
    data?: any;
    needsFeedback?: boolean; // Whether AI needs the results for continued conversation
    displayMode?: 'auto' | 'table' | 'cards' | 'stats' | 'chart' | 'list'; // How to display the data
}

interface AIResponse {
    response: string;
    directives: Directive[];
    requiresExecution: boolean;
    conversationOnly: boolean;
    expectsContinuation?: boolean; // Whether AI expects to continue the conversation
    contextSummary?: string; // Summary of current conversation context
}

interface Message {
    id: string;
    type: 'user' | 'ai' | 'system';
    content: string;
    timestamp: Date;
    isExecuting?: boolean;
    directives?: Directive[];
}

interface CopilotViewProps {
    isOpen: boolean;
    onClose: () => void;
    context?: {
        userRole?: string;
        currentPage?: string;
        teamId?: string;
        userId?: string;
    };
}

// Role-based starting prompts
const ROLE_PROMPTS = {
    ADMIN: [
        "Show me top performing teams this month",
        "Display team comparison analytics",
        "What's our overall SIM activation rate?",
        "Display regional performance breakdown",
        "Show me fraud detection alerts",
        "List pending approval requests",
        "Check user activity logs for today",
        "What are the latest onboarding requests?",
        "Display monthly sales report",
        "Show me revenue analytics",
        "List teams needing attention",
        "Display customer satisfaction metrics"
    ],
    TEAM_LEADER: [
        "Show my team's performance this month",
        "Display my team member activities",
        "What's my team's SIM activation rate?",
        "Show my team's quality metrics",
        "Check my team's daily targets",
        "Display my team's sales trends",
        "Show inactive SIM cards in my team",
        "What are my team's key challenges?",
        "Display my team's monthly progress",
        "Show my staff performance summary"
    ],
    VAN_STAFF: [
        "Show my daily SIM sales",
        "What's my activation rate today?",
        "Display my assigned SIM inventory",
        "Check my daily targets progress",
        "Show my recent customer registrations",
        "What's my performance this week?",
        "Display my route optimization",
        "Show my pending approvals",
        "Check my quality score",
        "Display my earnings summary"
    ],
    MPESA_ONLY_AGENT: [
        "Show my M-Pesa transaction summary",
        "What's my commission this month?",
        "Display my daily M-Pesa targets",
        "Check my transaction success rate",
        "Show my customer onboarding stats",
        "What are my pending M-Pesa approvals?",
        "Display my weekly performance",
        "Show my float management status",
        "Check my compliance scores",
        "Display my earnings breakdown"
    ],
    NON_MPESA_AGENT: [
        "Show my SIM sales performance",
        "What's my activation rate today?",
        "Display my customer registrations",
        "Check my daily sales targets",
        "Show my inventory status",
        "What's my quality score?",
        "Display my weekly progress",
        "Show my pending tasks",
        "Check my performance metrics",
        "Display my commission summary"
    ]
};

// Get 3 random prompts based on user role
function getRandomPrompts(userRole?: string): string[] {
    const role = userRole?.toUpperCase() as keyof typeof ROLE_PROMPTS;
    const prompts = ROLE_PROMPTS[role] || ROLE_PROMPTS.VAN_STAFF;
    const shuffled = [...prompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

export default function CopilotView({isOpen, onClose, context = {}}: CopilotViewProps) {
    // Initial welcome message
    const getInitialMessage = (): Message => ({
        id: '1',
        type: 'ai',
        content: 'Hello! I\'m **Mantix AI**, your intelligent copilot for SIM card management. How can I help you today?',
        timestamp: new Date()
    });

    const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
    const [showPrompts, setShowPrompts] = useState(false);
    const [conversationContext, setConversationContext] = useState<string>(''); // Store conversation context
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    // Smart display component selection based on data structure and mode
    const chooseDisplayComponent = (data: any, mode: string): string => {
        if (mode !== 'auto') {
            // Map display modes to components
            const modeMap: Record<string, string> = {
                'table': 'UserTable',
                'cards': 'TeamCards',
                'stats': 'StatsGrid',
                'chart': 'StatsGrid', // Use StatsGrid for chart-like data
                'list': 'UserTable'
            };
            return modeMap[mode] || 'StatsGrid';
        }

        // Auto-select based on data structure
        if (!data || typeof data !== 'object') return 'StatsGrid';

        // If data is an array of objects with user-like properties
        if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            if (firstItem.full_name || firstItem.email || firstItem.role) {
                return 'UserTable';
            }
            if (firstItem.name && (firstItem.region || firstItem.territory)) {
                return 'TeamCards';
            }
            return 'UserTable'; // Default for arrays
        }

        // If data has metric-like properties (numbers, percentages)
        if (typeof data === 'object' && !Array.isArray(data)) {
            const values = Object.values(data);
            const hasMetrics = values.some(v =>
                typeof v === 'number' ||
                (typeof v === 'string' && (v.includes('%') || v.includes('KSH')))
            );
            if (hasMetrics) return 'StatsGrid';
        }

        return 'StatsGrid'; // Default fallback
    };
    const router = useRouter();

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();

            // Generate random prompts based on user role and animate them in
            if (messages.length === 1) { // Only show on initial load
                const randomPrompts = getRandomPrompts(context.userRole);
                setSuggestedPrompts(randomPrompts);

                // Delayed animation for prompts
                setTimeout(() => {
                    setShowPrompts(true);
                }, 1000);
            }
        }
    }, [isOpen, isMinimized, messages.length]);

    const executeDirective = async (directive: Directive): Promise<any> => {
        try {
            // Execute real directive operations
            const response = await fetch('/api/mantix-ai/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    directive,
                    context
                }),
            });

            if (!response.ok) {
                throw new Error(`Execution failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Directive execution error:', error);
            throw error;
        }
    };

    const processDirectives = async (directives: Directive[], messageId: string) => {
        const executionResults: any[] = [];

        for (const directive of directives) {
            // Add system message for directive execution
            const systemMessage: Message = {
                id: `system-${Date.now()}-${Math.random()}`,
                type: 'system',
                content: `🔄 ${directive.caption}`,
                timestamp: new Date(),
                isExecuting: true
            };

            setMessages(prev => [...prev, systemMessage]);
            console.log("directive: ", directive.type);
            try {
                const result = await executeDirective(directive);

                // Update system message to show completion
                setMessages(prev => prev.map(msg =>
                    msg.id === systemMessage.id
                        ? {...msg, content: `✅ ${directive.caption}`, isExecuting: false}
                        : msg
                ));
                // Store result for AI feedback
                executionResults.push({
                    directive: directive.name,
                    success: true,
                    data: result.data,
                    summary: result.summary || `Successfully executed ${directive.name}`
                });

                // Handle different directive types
                if (directive.type === 'fetch' && result.data) {
                    // Update the original AI message with smart display
                    setMessages(prev => prev.map(msg =>
                        msg.id === messageId
                            ? {
                                ...msg,
                                directives: msg.directives?.map(d =>
                                    d.name === directive.name
                                        ? {
                                            ...d,
                                            data: result.data,
                                            displayComponent: chooseDisplayComponent(result.data, directive.displayMode || 'auto')
                                        }
                                        : d
                                )
                            }
                            : msg
                    ));
                } else if (directive.type === 'navigate' && result.success && result.data?.route) {
                    // Handle navigation with enhanced feedback
                    if (result.data.navigationType === 'client_redirect') {
                        // Show user-friendly navigation message
                        const navMessage = result.data.caption || result.data.routeName || `Navigating to ${result.data.route}`;

                        // Update system message with custom caption if provided
                        if (result.data.caption || result.data.routeName) {
                            setMessages(prev => prev.map(msg =>
                                msg.id === systemMessage.id
                                    ? {...msg, content: `🧭 ${navMessage}`}
                                    : msg
                            ));
                        }

                        // Delay navigation slightly to show the message
                        setTimeout(() => {
                            const href = result.data.route;
                            alert(56)
                            Signal.trigger("app-page-loading", true)
                            router.push(href, {scroll: false});
                        }, 500);
                    }
                }

            } catch (error) {
                setMessages(prev => prev.map(msg =>
                    msg.id === systemMessage.id
                        ? {...msg, content: `❌ Failed: ${directive.caption}`, isExecuting: false}
                        : msg
                ));

                executionResults.push({
                    directive: directive.name,
                    success: false,
                    error: (error as Error).message,
                    summary: `Failed to execute ${directive.name}: ${(error as Error).message}`
                });
            }
        }

        // Send execution results back to AI only if any directive needs feedback
        const needsFeedback = directives.some(d => d.needsFeedback);
        if (executionResults.length > 0 && needsFeedback) {
            await sendExecutionFeedbackToAI(executionResults, messageId);
        }
    };

    const sendExecutionFeedbackToAI = async (executionResults: any[], originalMessageId: string) => {
        try {
            const feedbackMessage = `EXECUTION_RESULTS: ${JSON.stringify(executionResults.map(r => ({
                directive: r.directive,
                success: r.success,
                summary: r.summary,
                hasData: !!r.data
            })))}`;

            const response = await fetch('/api/mantix-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: feedbackMessage,
                    context: {
                        ...context,
                        isExecutionFeedback: true,
                        originalMessageId
                    }
                }),
            });

            if (response.ok) {
                const followUpResponse = await response.json();

                // Only add follow-up message if AI has something meaningful to say
                if (followUpResponse.response && !followUpResponse.conversationOnly) {
                    const followUpMessage: Message = {
                        id: `ai-followup-${Date.now()}`,
                        type: 'ai',
                        content: followUpResponse.response,
                        timestamp: new Date(),
                        directives: followUpResponse.directives
                    };

                    setMessages(prev => [...prev, followUpMessage]);

                    // Execute any new directives from the follow-up
                    if (followUpResponse.requiresExecution && followUpResponse.directives.length > 0) {
                        await processDirectives(followUpResponse.directives, followUpMessage.id);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to send execution feedback to AI:', error);
        }
    };

    const sendMessage = async (messageText?: string) => {
        const messageToSend = messageText || input.trim();
        if (!messageToSend || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: messageToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setShowPrompts(false); // Hide prompts after first message

        try {
            // Build conversation context for long conversations
            const recentMessages = messages.slice(-6); // Last 6 messages for context
            const contextualMessage = conversationContext
                ? `CONTEXT: ${conversationContext}\n\nUSER: ${messageToSend}`
                : messageToSend;

            const response = await fetch('/api/mantix-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: contextualMessage,
                    context: {
                        ...context,
                        recentMessages: recentMessages.map(m => ({
                            type: m.type,
                            content: m.content.substring(0, 200), // Truncate for efficiency
                            timestamp: m.timestamp
                        }))
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const aiResponse: AIResponse = await response.json();

            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                type: 'ai',
                content: aiResponse.response,
                timestamp: new Date(),
                directives: aiResponse.directives
            };

            setMessages(prev => [...prev, aiMessage]);

            // Update conversation context if provided
            if (aiResponse.contextSummary) {
                setConversationContext(aiResponse.contextSummary);
            }

            // Execute directives if required
            if (aiResponse.requiresExecution && aiResponse.directives.length > 0) {
                await processDirectives(aiResponse.directives, aiMessage.id);
            }

        } catch (error) {
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                type: 'ai',
                content: 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Function to start a new chat
    const startNewChat = () => {
        // Reset all state to initial values
        setMessages([getInitialMessage()]);
        setInput('');
        setIsLoading(false);
        setSuggestedPrompts([]);
        setShowPrompts(false);
        setConversationContext(''); // Reset conversation context

        // Generate new random prompts
        const randomPrompts = getRandomPrompts(context.userRole);
        setSuggestedPrompts(randomPrompts);

        // Show prompts with animation after a delay
        setTimeout(() => {
            setShowPrompts(true);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed right-0 top-0 bottom-0 h-full bg-white shadow-2xl transition-all duration-300 z-50 ${
            isMinimized ? 'w-16' : 'w-96'
        } border-l border-gray-200`}>
            <div className="flex h-full flex-col">
                {/* Header */}
                <div
                    className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 text-white">
                    {!isMinimized && (
                        <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6"/>
                            <div>
                                <h3 className="font-semibold">Mantix AI</h3>
                                <p className="text-xs opacity-80">Your SIM Management Copilot</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        {!isMinimized && (
                            <button
                                onClick={startNewChat}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                                title="Start New Chat"
                            >
                                <RotateCcw className="w-4 h-4"/>
                            </button>
                        )}
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            {isMinimized ? <Maximize2 className="w-4 h-4"/> : <Minimize2 className="w-4 h-4"/>}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            <X className="w-4 h-4"/>
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-140px)]">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex items-start space-x-2 ${
                                        message.type === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {message.type !== 'user' && (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            message.type === 'ai' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {message.type === 'ai' ? <Bot className="w-4 h-4"/> :
                                                <div className="w-2 h-2 bg-current rounded-full"/>}
                                        </div>
                                    )}

                                    <div className={`max-w-[80%] ${
                                        message.type === 'user'
                                            ? 'bg-green-600 text-white'
                                            : message.type === 'system'
                                                ? 'bg-green-50 text-green-800 border border-green-200'
                                                : 'bg-gray-100 text-gray-800'
                                    } rounded-lg px-3 py-2`}>
                                        <div className="text-sm prose prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    // Custom styling for markdown elements
                                                    p: ({node, ...props}) => <p
                                                        className="mb-2 last:mb-0" {...props} />,
                                                    ul: ({node, ...props}) => <ul
                                                        className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                                    ol: ({node, ...props}) => <ol
                                                        className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                                    li: ({node, ...props}) => <li className="ml-4" {...props} />,
                                                    strong: ({node, ...props}) => <strong
                                                        className="font-bold text-gray-900" {...props} />,
                                                    em: ({node, ...props}) => <em className="italic" {...props} />,
                                                    code: ({node, ...props}) => <code
                                                        className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                                                    blockquote: ({node, ...props}) => <blockquote
                                                        className="border-l-4 border-green-500 pl-4 italic text-gray-700 mb-2" {...props} />,
                                                    h1: ({node, ...props}) => <h1
                                                        className="text-lg font-bold mb-2" {...props} />,
                                                    h2: ({node, ...props}) => <h2
                                                        className="text-base font-bold mb-1" {...props} />,
                                                    h3: ({node, ...props}) => <h3
                                                        className="text-sm font-bold mb-1" {...props} />,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Display Components for AI Directives */}
                                        {message.directives?.map((directive, index) => {
                                            if (directive.type === 'display' && directive.data) {
                                                switch (directive.displayComponent) {
                                                    case 'UserTable':
                                                        return (
                                                            <div key={index} className="mt-3 border-t pt-3">
                                                                <UserTable data={directive.data}
                                                                           title={directive.name}/>
                                                            </div>
                                                        );
                                                    case 'TeamCards':
                                                        return (
                                                            <div key={index} className="mt-3 border-t pt-3">
                                                                <TeamCards data={directive.data}
                                                                           title={directive.name}/>
                                                            </div>
                                                        );
                                                    case 'StatsGrid':
                                                        return (
                                                            <div key={index} className="mt-3 border-t pt-3">
                                                                <StatsGrid data={directive.data}
                                                                           title={directive.name}/>
                                                            </div>
                                                        );
                                                    default:
                                                        return null;
                                                }
                                            }
                                            return null;
                                        })}
                                        {message.isExecuting && (
                                            <Loader2 className="w-3 h-3 animate-spin inline ml-2"/>
                                        )}
                                        <p className="text-xs opacity-60 mt-1">
                                            {message.timestamp.toLocaleTimeString()}
                                        </p>
                                    </div>

                                    {message.type === 'user' && (
                                        <div
                                            className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                                            <User className="w-4 h-4"/>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-start space-x-2">
                                    <div
                                        className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin"/>
                                    </div>
                                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                                        <p className="text-sm text-gray-600">Thinking...</p>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef}/>
                        </div>

                        {/* Suggested Prompts */}
                        {showPrompts && suggestedPrompts.length > 0 && messages.length === 1 && (
                            <div className="border-t border-gray-100 p-4 bg-gray-50">
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-gray-600 mb-2">💡 Quick start suggestions:</p>
                                    <div className="space-y-2">
                                        {suggestedPrompts.map((prompt, index) => (
                                            <div
                                                key={index}
                                                className={`transform transition-all duration-500 ease-out ${
                                                    showPrompts
                                                        ? 'translate-y-0 opacity-100'
                                                        : 'translate-y-4 opacity-0'
                                                }`}
                                                style={{
                                                    transitionDelay: `${index * 150}ms`
                                                }}
                                            >
                                                <button
                                                    onClick={() => sendMessage(prompt)}
                                                    disabled={isLoading}
                                                    className="w-full text-left p-3 text-sm bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                                                >
                                                    <div className="flex items-center justify-between">
                          <span className="text-gray-700 group-hover:text-green-700">
                            {prompt}
                          </span>
                                                        <svg
                                                            className="w-4 h-4 text-gray-400 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all duration-200"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                                        </svg>
                                                    </div>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="border-t border-gray-200 p-4">
                            <div className="flex space-x-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything about your SIM data..."
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                                <button
                                    //@ts-ignore
                                    onClick={sendMessage}
                                    disabled={isLoading || !input.trim()}
                                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4"/>
                                </button>
                            </div>

                            {/* AI Disclaimer */}
                            <div className="mt-3 px-2">
                                <p className="text-xs text-gray-500 text-center leading-relaxed">
                                    <span className="inline-block mr-1">⚠️</span>
                                    Mantix AI can make mistakes. Please verify important information and double-check
                                    critical decisions.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}