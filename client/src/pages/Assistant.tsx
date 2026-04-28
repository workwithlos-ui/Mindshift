// ============================================================
// ASSISTANT SCREEN — AI Chat powered by GPT-4.1-mini
// Knows King's context. Agent roles. Streaming.
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kingSystemPrompt, agents, type Agent } from '@/lib/content';
import { streamChat, type ChatMessage } from '@/lib/ai';
import { PageHeader, Hairline } from '@/components/ui-shared';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const QUICK_PROMPTS = [
  "What's my highest-leverage action right now?",
  "Help me write a content hook",
  "Build me a simple automation workflow",
  "Review my business strategy",
  "What should I focus on today?",
];

export default function Assistant({
  initialAgent,
  onAgentClear,
}: {
  initialAgent: Agent | null;
  onAgentClear: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(initialAgent);
  const [showAgents, setShowAgents] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync initial agent
  useEffect(() => {
    setActiveAgent(initialAgent);
    if (initialAgent) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `${initialAgent.name} Agent activated. What do you need?`,
      }]);
    }
  }, [initialAgent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSystemPrompt = useCallback(() => {
    if (activeAgent) {
      return `${kingSystemPrompt}\n\n---\n\nCurrent role: ${activeAgent.prompt}`;
    }
    return kingSystemPrompt;
  }, [activeAgent]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: text.trim() };
    const aiId = `a_${Date.now()}`;
    const aiMsg: Message = { id: aiId, role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setLoading(true);

    const history: ChatMessage[] = [
      { role: 'system', content: getSystemPrompt() },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: text.trim() },
    ];

    abortRef.current = new AbortController();

    await streamChat(
      history,
      (chunk) => {
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: m.content + chunk } : m
        ));
      },
      () => {
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, streaming: false } : m
        ));
        setLoading(false);
      },
      (err) => {
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: `Error: ${err}`, streaming: false } : m
        ));
        setLoading(false);
      },
      abortRef.current.signal,
    );
  }, [loading, messages, getSystemPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setActiveAgent(null);
    onAgentClear();
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <div className="container pt-14">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span
              className="block text-[10px] tracking-[0.12em] uppercase mb-2"
              style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}
            >
              ASSISTANT · AI CHIEF OF STAFF
            </span>
            <h1
              className="text-[1.6rem] leading-[1.15] tracking-[-0.025em] text-[#F5F4F1]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
            >
              {activeAgent ? `${activeAgent.name} Agent` : 'MindShift AI'}
            </h1>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {/* Agent selector */}
            <button
              onClick={() => setShowAgents(!showAgents)}
              className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.7rem',
                background: showAgents ? '#E8E0D0' : 'rgba(255,255,255,0.06)',
                color: showAgents ? '#0A0A0B' : 'rgba(255,255,255,0.5)',
                border: showAgents ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Agents
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-3 py-1.5 rounded-full text-xs text-white/30 hover:text-white/60 transition-colors"
                style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active agent badge */}
        {activeAgent && (
          <div
            className="flex items-center gap-2 py-2 px-3 rounded-xl mb-4 w-fit"
            style={{ background: 'rgba(232,224,208,0.07)', border: '1px solid rgba(232,224,208,0.12)' }}
          >
            <span className="text-bone text-sm">{activeAgent.icon}</span>
            <span className="text-bone/70 text-xs" style={{ fontFamily: 'var(--font-ui)' }}>
              {activeAgent.name} Agent active
            </span>
            <button
              onClick={() => { setActiveAgent(null); onAgentClear(); }}
              className="text-white/25 hover:text-white/50 transition-colors text-xs ml-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Agent selector dropdown */}
        <AnimatePresence>
          {showAgents && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-3 mb-4"
              style={{ background: 'rgba(17,17,19,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
            >
              <div className="grid grid-cols-1 gap-1.5">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setActiveAgent(agent);
                      setShowAgents(false);
                      setMessages([{
                        id: `welcome_${agent.id}`,
                        role: 'assistant',
                        content: `${agent.name} Agent activated. ${agent.description}. What do you need?`,
                      }]);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: activeAgent?.id === agent.id ? 'rgba(232,224,208,0.08)' : 'transparent',
                    }}
                  >
                    <span className="text-bone/60 text-sm w-5 text-center">{agent.icon}</span>
                    <div>
                      <p className="text-[#F5F4F1] text-xs font-medium" style={{ fontFamily: 'var(--font-ui)' }}>
                        {agent.name}
                      </p>
                      <p className="text-white/30 text-xs" style={{ fontFamily: 'var(--font-ui)' }}>
                        {agent.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Hairline className="mb-4" />
      </div>

      {/* Messages */}
      <div className="flex-1 container pb-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="py-8">
            <p
              className="text-white/25 text-center mb-6 text-base"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
            >
              Your chief of staff is ready.
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left p-3.5 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
                    {prompt}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className="text-[9px] tracking-[0.1em] uppercase"
                          style={{ fontFamily: 'var(--font-mono)', color: '#E8E0D0', opacity: 0.5 }}
                        >
                          {activeAgent ? activeAgent.name : 'MindShift'}
                        </span>
                        {msg.streaming && (
                          <span className="inline-flex gap-0.5">
                            {[0,1,2].map(i => (
                              <motion.span
                                key={i}
                                className="w-1 h-1 rounded-full bg-bone/40"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    )}
                    <p
                      className="text-[#F5F4F1] text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: 'var(--font-ui)', lineHeight: 1.65 }}
                    >
                      {msg.content || (msg.streaming ? '' : '...')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="sticky bottom-0 left-0 right-0 pb-24"
        style={{ background: 'linear-gradient(to top, rgba(10,10,11,1) 60%, transparent)' }}
      >
        <div className="container">
          <div
            className="flex items-end gap-3 p-3 rounded-2xl"
            style={{
              background: 'rgba(17,17,19,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 bg-transparent text-[#F5F4F1] text-sm outline-none resize-none placeholder:text-white/25 leading-relaxed"
              style={{ fontFamily: 'var(--font-ui)', lineHeight: 1.5, maxHeight: 120 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
              style={{
                background: input.trim() && !loading ? '#E8E0D0' : 'rgba(255,255,255,0.08)',
              }}
            >
              {loading ? (
                <motion.div
                  className="w-3 h-3 rounded-full border border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ color: '#0A0A0B' }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 12V2M7 2L2 7M7 2L12 7" stroke={input.trim() ? '#0A0A0B' : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
