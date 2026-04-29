// ============================================================
// ASSISTANT SCREEN — Oracle Edition
// Premium AI chat with amethyst accent + agent roles.
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kingSystemPrompt, agents, type Agent } from '@/lib/content';
import { streamChat, type ChatMessage } from '@/lib/ai';
import { PageHeader, Hairline, EASE } from '@/components/ui-shared';
import { VoiceMic } from '@/components/VoiceMic';
import { getMemory, appendMemory, getProfile } from '@/lib/storage';
import { getAIContext } from '@/lib/personalization';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const QUICK_PROMPTS = [
  { text: "What's my highest-leverage action right now?", icon: '→', accent: 'var(--amethyst)' },
  { text: "Help me write a content hook", icon: '✎', accent: 'var(--peach)' },
  { text: "Build me a simple automation workflow", icon: '⚙', accent: 'var(--ice)' },
  { text: "Review my business strategy", icon: '◆', accent: 'var(--mint)' },
  { text: "What should I focus on today?", icon: '◎', accent: 'var(--teal)' },
];

const AGENT_COLORS: Record<string, string> = {
  ceo: 'var(--amethyst)',
  revenue: 'var(--mint)',
  content: 'var(--peach)',
  ops: 'var(--teal)',
  mindset: 'var(--ice)',
  fitness: 'var(--coral)',
};

export default function Assistant({
  initialAgent,
  onAgentClear,
}: {
  initialAgent: Agent | null;
  onAgentClear: () => void;
}) {
  // Rehydrate last 20 turns from persistent memory on first mount
  const [messages, setMessages] = useState<Message[]>(() => {
    const mem = getMemory().slice(-20);
    return mem.map((m, i) => ({
      id: `mem_${i}_${m.ts}`,
      role: m.role,
      content: m.content,
    }));
  });
  const [input, setInput] = useState('');
  const [interimInput, setInterimInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(initialAgent);
  const [showAgents, setShowAgents] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setActiveAgent(initialAgent);
    if (initialAgent) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `${initialAgent.name} activated. What do you need?`,
      }]);
    }
  }, [initialAgent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSystemPrompt = useCallback(() => {
    let base = kingSystemPrompt;
    const profile = getProfile();
    if (profile.notes.length) {
      base += `\n\n---\n\nLong-term context (always remember):\n- ${profile.notes.join('\n- ')}`;
    }
    const behaviorContext = getAIContext();
    if (behaviorContext) {
      base += `\n\n---\n\nBehavior signal (use to adapt tone):\n${behaviorContext}`;
    }
    if (activeAgent) {
      base += `\n\n---\n\nCurrent role: ${activeAgent.prompt}`;
    }
    return base;
  }, [activeAgent]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: text.trim() };
    const aiId = `a_${Date.now()}`;
    const aiMsg: Message = { id: aiId, role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    appendMemory({ role: 'user', content: text.trim(), ts: Date.now() });
    setInput('');
    setInterimInput('');
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
        setMessages(prev => {
          const done = prev.map(m => m.id === aiId ? { ...m, streaming: false } : m);
          const final = done.find(m => m.id === aiId);
          if (final && final.content) {
            appendMemory({ role: 'assistant', content: final.content, ts: Date.now() });
          }
          return done;
        });
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
    // Keep long-term memory; just clear the visible thread.
  };

  const agentAccent = activeAgent ? AGENT_COLORS[activeAgent.id] ?? 'var(--amethyst)' : 'var(--amethyst)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="min-h-screen flex flex-col safe-top"
    >
      <div className="container pt-8">
        <PageHeader
          stamp="ASSISTANT · AI CHIEF OF STAFF"
          title={activeAgent ? activeAgent.name : 'Oracle.'}
          subtitle={activeAgent ? activeAgent.description : 'Think together. Decide faster. Execute sharper.'}
          accent={agentAccent}
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAgents(!showAgents)}
                className="px-3 py-1.5 rounded-full transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  background: showAgents
                    ? 'linear-gradient(180deg, #C9B8FF 0%, #A68FFF 100%)'
                    : 'rgba(255,255,255,0.04)',
                  color: showAgents ? '#0A0A0F' : 'rgba(245,244,248,0.55)',
                  border: showAgents ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: showAgents ? '0 4px 12px rgba(184,164,255,0.25)' : 'none',
                }}
              >
                AGENTS
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-3 py-1.5 rounded-full font-mono-stamp text-white/40 hover:text-white/70 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  CLEAR
                </button>
              )}
            </div>
          }
        />

        {/* Active agent badge */}
        {activeAgent && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 py-1.5 px-3 rounded-full mb-5 w-fit"
            style={{
              background: `linear-gradient(135deg, ${agentAccent}22 0%, ${agentAccent}08 100%)`,
              border: `1px solid ${agentAccent}44`,
            }}
          >
            <span className="pulse-dot" style={{ background: agentAccent }} />
            <span
              className="text-xs"
              style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                color: agentAccent,
              }}
            >
              {activeAgent.name} active
            </span>
            <button
              onClick={() => { setActiveAgent(null); onAgentClear(); }}
              className="text-white/40 hover:text-white/70 transition-colors text-xs ml-1"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Agent selector dropdown */}
        <AnimatePresence>
          {showAgents && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="card-elevated p-2 mb-5"
            >
              <div className="grid grid-cols-1 gap-1">
                {agents.map(agent => {
                  const color = AGENT_COLORS[agent.id] ?? 'var(--amethyst)';
                  const isActive = activeAgent?.id === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setActiveAgent(agent);
                        setShowAgents(false);
                        setMessages([{
                          id: `welcome_${agent.id}`,
                          role: 'assistant',
                          content: `${agent.name} activated. ${agent.description}. What do you need?`,
                        }]);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.005]"
                      style={{
                        background: isActive ? `${color}15` : 'transparent',
                        border: isActive ? `1px solid ${color}40` : '1px solid transparent',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[#F5F4F8] text-sm"
                          style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}
                        >
                          {agent.name}
                        </p>
                        <p
                          className="text-white/40 text-xs truncate"
                          style={{ fontFamily: 'var(--font-ui)' }}
                        >
                          {agent.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Hairline className="mb-5" />
      </div>

      {/* Messages */}
      <div className="flex-1 container pb-4">
        {messages.length === 0 ? (
          <div className="py-4">
            <p
              className="text-white/35 mb-5 text-center"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '1.1rem',
                letterSpacing: '-0.02em',
              }}
            >
              Your chief of staff is ready.
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35, ease: EASE }}
                  onClick={() => sendMessage(prompt.text)}
                  className="w-full text-left p-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.005] group flex items-center gap-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                    style={{
                      background: `${prompt.accent}15`,
                      border: `1px solid ${prompt.accent}30`,
                      color: prompt.accent,
                    }}
                  >
                    {prompt.icon}
                  </span>
                  <span
                    className="text-white/65 text-sm flex-1"
                    style={{ fontFamily: 'var(--font-ui)', fontWeight: 400 }}
                  >
                    {prompt.text}
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
                    style={{ color: 'rgba(245,244,248,0.25)' }}
                  >
                    <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[86%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? '' : ''}`}
                    style={msg.role === 'user' ? {
                      background: 'linear-gradient(180deg, rgba(184,164,255,0.14) 0%, rgba(122,92,232,0.08) 100%)',
                      border: '1px solid rgba(184,164,255,0.22)',
                      borderBottomRightRadius: '6px',
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderBottomLeftRadius: '6px',
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className="pulse-dot"
                          style={{
                            background: agentAccent,
                            opacity: msg.streaming ? 1 : 0.6,
                          }}
                        />
                        <span
                          className="font-mono-stamp"
                          style={{ color: agentAccent, fontWeight: 600 }}
                        >
                          {activeAgent ? activeAgent.name.toUpperCase() : 'MINDSHIFT'}
                        </span>
                        {msg.streaming && (
                          <span className="inline-flex gap-0.5 ml-1">
                            {[0,1,2].map(i => (
                              <motion.span
                                key={i}
                                className="w-1 h-1 rounded-full"
                                style={{ background: agentAccent }}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    )}
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        fontFamily: 'var(--font-ui)',
                        lineHeight: 1.65,
                        color: msg.role === 'user' ? 'rgba(245,244,248,0.95)' : 'rgba(245,244,248,0.88)',
                      }}
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
        className="sticky bottom-0 left-0 right-0 pb-24 z-10"
        style={{ background: 'linear-gradient(to top, rgba(10,10,15,1) 65%, transparent)' }}
      >
        <div className="container pt-3">
          <div
            className="flex items-end gap-2 p-2.5 rounded-2xl"
            style={{
              background: 'rgba(20,20,28,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input + (interimInput ? (input.endsWith(' ') || !input ? '' : ' ') + interimInput : '')}
              onChange={e => {
                setInput(e.target.value);
                setInterimInput('');
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder={activeAgent ? `Ask ${activeAgent.name}…` : 'Ask anything…'}
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none placeholder:text-white/25 py-1.5 px-2"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                maxHeight: 120,
                color: '#F5F4F8',
              }}
            />
            <VoiceMic
              onFinalText={(t) => { setInput(prev => (prev + t).trimStart()); setInterimInput(''); }}
              onInterimText={(t) => setInterimInput(t)}
              color={agentAccent}
              size={40}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 disabled:opacity-30"
              style={{
                background: input.trim() && !loading
                  ? `linear-gradient(135deg, ${agentAccent} 0%, ${agentAccent}CC 100%)`
                  : 'rgba(255,255,255,0.06)',
                boxShadow: input.trim() && !loading ? `0 4px 16px ${agentAccent}40` : 'none',
              }}
            >
              {loading ? (
                <motion.div
                  className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ color: '#0A0A0F' }}
                />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 13V3M8 3L3 8M8 3L13 8"
                    stroke={input.trim() ? '#0A0A0F' : 'rgba(255,255,255,0.5)'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
