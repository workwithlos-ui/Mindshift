// ============================================================
// MINDSHIFT AI — ASSISTANT (Intelligence Edition)
// - 7 specialized agents with deep system prompts
// - 3-tier memory (session / persistent / behavioral)
// - Agent auto-routing
// - Cross-agent handoffs via [→agent] tags
// - Prompt chaining for multi-step tasks
// - Lightweight response evaluator with retry
// - Engagement tracking per agent
// ============================================================

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AGENTS, AGENT_ORDER, routeAgent, type AgentId, type AgentDef } from '@/lib/agents';
import { buildAgentContext, getSessionTurns } from '@/lib/memory';
import {
  addHandoff, parseHandoffs, stripHandoffs, getHandoffsFor, markConsumed,
  addInsight,
} from '@/lib/agentContext';
import { matchChain, buildChainStepPrompt, type ChainPlan } from '@/lib/chain';
import { evaluateResponse, recordAsk, recordFollowUp } from '@/lib/evaluator';
import { streamChat, singleChat, type ChatMessage } from '@/lib/ai';
import { PageHeader, Hairline, EASE } from '@/components/ui-shared';
import { VoiceMic } from '@/components/VoiceMic';
import { appendMemory } from '@/lib/storage';
import { type Agent } from '@/lib/content';

// Bridge between legacy `Agent` type (still used by Execute.tsx)
// and the new AgentId system. Matches by id.
function legacyToNewId(legacy: Agent | null): AgentId | null {
  if (!legacy) return null;
  if ((AGENT_ORDER as string[]).includes(legacy.id)) return legacy.id as AgentId;
  // Map old 'ceo', 'revenue', 'content', 'ops' to new equivalents
  const map: Record<string, AgentId> = {
    ceo: 'research', revenue: 'growth', content: 'marketing', ops: 'build',
  };
  return map[legacy.id] ?? 'research';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: AgentId;
  streaming?: boolean;
  chainStep?: { planName: string; step: number; total: number };
  evalScore?: number;
}

const QUICK_PROMPTS: { text: string; agent: AgentId }[] = [
  { text: "What's my highest-leverage action right now?", agent: 'growth' },
  { text: 'Draft 3 hooks for a post about execution', agent: 'marketing' },
  { text: 'Audit my last 7 days — what does the data say?', agent: 'analytics' },
  { text: 'Break down my current build into weekly milestones', agent: 'build' },
  { text: "I'm stuck. Reset me.", agent: 'mindset' },
];

export default function Assistant({
  initialAgent,
  onAgentClear,
}: {
  initialAgent: Agent | null;
  onAgentClear: () => void;
}) {
  // Hydrate last 20 turns from persistent memory
  const [messages, setMessages] = useState<Message[]>(() => {
    const mem = getSessionTurns(20);
    return mem.map((m, i) => ({
      id: `mem_${i}_${m.ts}`,
      role: m.role,
      content: m.content,
    }));
  });
  const [input, setInput] = useState('');
  const [interimInput, setInterimInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(legacyToNewId(initialAgent));
  const [autoRoute, setAutoRoute] = useState<boolean>(true);
  const [showAgents, setShowAgents] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastUserTsRef = useRef<number>(0);

  useEffect(() => {
    const id = legacyToNewId(initialAgent);
    setActiveAgent(id);
    if (id) {
      const a = AGENTS[id];
      setMessages([{
        id: `welcome_${id}`,
        role: 'assistant',
        agent: id,
        content: `${a.name} active. ${a.role}. What do you need?`,
      }]);
    }
  }, [initialAgent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentAgent: AgentDef = useMemo(
    () => (activeAgent ? AGENTS[activeAgent] : AGENTS.research),
    [activeAgent],
  );

  // ── Build the full system prompt for a given agent ──
  const buildSystem = useCallback((agentId: AgentId, chainInjection?: string) => {
    const a = AGENTS[agentId];
    const userContext = buildAgentContext(agentId);

    // Pull any handoffs queued for this agent
    const handoffs = getHandoffsFor(agentId, 5);
    let handoffBlock = '';
    if (handoffs.length) {
      handoffBlock = '\n\n# INBOX FROM TEAMMATES\n' +
        handoffs.map(h => `- from ${h.from}: ${h.note}`).join('\n');
      // Mark them consumed so we don't re-inject next turn
      markConsumed(handoffs.map(h => h.id));
    }

    let prompt = `${a.systemPrompt}\n\n${userContext}${handoffBlock}`;
    if (chainInjection) prompt += `\n\n${chainInjection}`;
    return prompt;
  }, []);

  // ── Run a single agent turn and stream response ──
  // Returns the final text.
  const runAgentTurn = useCallback(
    async (
      agentId: AgentId,
      userText: string,
      chainInjection: string | undefined,
      chainBadge?: { planName: string; step: number; total: number },
    ): Promise<string> => {
      const aiId = `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const aiMsg: Message = {
        id: aiId, role: 'assistant', content: '',
        streaming: true, agent: agentId, chainStep: chainBadge,
      };
      setMessages(prev => [...prev, aiMsg]);

      const history: ChatMessage[] = [
        { role: 'system', content: buildSystem(agentId, chainInjection) },
        ...messages
          .filter(m => !m.streaming && m.content)
          .slice(-10)
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: userText },
      ];

      abortRef.current = new AbortController();

      return new Promise<string>((resolve) => {
        let finalText = '';
        streamChat(
          history,
          (chunk) => {
            finalText += chunk;
            setMessages(prev => prev.map(m =>
              m.id === aiId ? { ...m, content: m.content + chunk } : m
            ));
          },
          async () => {
            // Evaluate quality
            const evalOut = evaluateResponse(finalText, agentId);
            recordAsk(agentId, evalOut.score);

            // Retry once if score too low
            if (evalOut.score < 0.55 && evalOut.retryHint && finalText.length > 20) {
              setMessages(prev => prev.map(m =>
                m.id === aiId
                  ? { ...m, content: '', streaming: true }
                  : m
              ));
              // Single-shot retry (non-stream) with the hint appended
              try {
                const retryHistory: ChatMessage[] = [
                  { role: 'system', content: buildSystem(agentId, chainInjection) + `\n\n# RETRY INSTRUCTION\nYour previous draft was too weak. ${evalOut.retryHint}` },
                  { role: 'user', content: userText },
                ];
                const retry = await singleChat(retryHistory);
                if (retry && retry.trim().length > 20) {
                  finalText = retry;
                  setMessages(prev => prev.map(m =>
                    m.id === aiId ? { ...m, content: retry, streaming: false, evalScore: evaluateResponse(retry, agentId).score } : m
                  ));
                } else {
                  setMessages(prev => prev.map(m =>
                    m.id === aiId ? { ...m, streaming: false, evalScore: evalOut.score } : m
                  ));
                }
              } catch {
                setMessages(prev => prev.map(m =>
                  m.id === aiId ? { ...m, streaming: false, evalScore: evalOut.score } : m
                ));
              }
            } else {
              setMessages(prev => prev.map(m =>
                m.id === aiId ? { ...m, streaming: false, evalScore: evalOut.score } : m
              ));
            }

            // Parse handoffs and persist them
            const handoffs = parseHandoffs(agentId, finalText);
            handoffs.forEach(h => addHandoff({ from: h.from, to: h.to, note: h.note }));

            // Clean text for memory (strip the [→agent] tags)
            const cleanText = stripHandoffs(finalText);

            // Extract insights from high-signal single-agent responses
            if (!chainBadge && evalOut.score >= 0.7 && cleanText.length > 60) {
              const firstLine = cleanText.split('\n')[0].trim();
              if (firstLine.length < 180 && firstLine.length > 40) {
                addInsight(agentId, firstLine);
              }
            }

            appendMemory({ role: 'assistant', content: cleanText, ts: Date.now() });

            // Update the displayed content to the stripped version
            setMessages(prev => prev.map(m =>
              m.id === aiId ? { ...m, content: cleanText } : m
            ));

            resolve(cleanText);
          },
          (err) => {
            setMessages(prev => prev.map(m =>
              m.id === aiId ? { ...m, content: `Error: ${err}`, streaming: false } : m
            ));
            resolve('');
          },
          abortRef.current!.signal,
        );
      });
    },
    [messages, buildSystem],
  );

  // ── Send a user message ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    const now = Date.now();

    // Engagement: if user sent another message within 90s of the last, count as follow-up
    if (lastUserTsRef.current && now - lastUserTsRef.current < 90_000) {
      const lastAgent = [...messages].reverse().find(m => m.role === 'assistant')?.agent;
      if (lastAgent) recordFollowUp(lastAgent);
    }
    lastUserTsRef.current = now;

    const userMsg: Message = { id: `u_${now}`, role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    appendMemory({ role: 'user', content: userText, ts: now });
    setInput('');
    setInterimInput('');
    setLoading(true);

    try {
      // Detect if this is a multi-step chain
      const chain: ChainPlan | null = matchChain(userText);

      if (chain) {
        // Run each step sequentially, feeding previous outputs in
        const priorOutputs: { agent: AgentId; text: string }[] = [];
        for (let i = 0; i < chain.steps.length; i++) {
          const step = chain.steps[i];
          const injection = buildChainStepPrompt(chain, i, userText, priorOutputs);
          const out = await runAgentTurn(
            step.agent,
            userText,
            injection,
            { planName: chain.name, step: i + 1, total: chain.steps.length },
          );
          if (out) priorOutputs.push({ agent: step.agent, text: out });
        }
      } else {
        // Single-agent turn. Use activeAgent if set, else auto-route.
        const target: AgentId = activeAgent ?? (autoRoute ? routeAgent(userText) : 'research');
        await runAgentTurn(target, userText, undefined);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, messages, activeAgent, autoRoute, runAgentTurn]);

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

  const agentAccent = currentAgent.accent;

  // ── UI ─────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="min-h-screen flex flex-col safe-top"
    >
      <div className="container pt-8">
        <PageHeader
          stamp="ASSISTANT · AGENT TEAM"
          title={activeAgent ? AGENTS[activeAgent].name : 'Oracle.'}
          subtitle={activeAgent ? AGENTS[activeAgent].role : 'Seven agents. One operator. Ask.'}
          accent={agentAccent}
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAgents(v => !v)}
                className="px-3 py-1.5 rounded-full transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  background: showAgents
                    ? `linear-gradient(180deg, ${agentAccent} 0%, color-mix(in srgb, ${agentAccent} 70%, #000) 100%)`
                    : 'rgba(255,255,255,0.04)',
                  color: showAgents ? '#0A0A0F' : 'rgba(245,244,248,0.55)',
                  border: showAgents ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                AGENTS
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-3 py-1.5 rounded-full text-white/40 hover:text-white/70 transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
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

        {/* Active agent badge + auto-route toggle */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {activeAgent ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 py-1.5 px-3 rounded-full"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${agentAccent} 18%, transparent) 0%, color-mix(in srgb, ${agentAccent} 5%, transparent) 100%)`,
                border: `1px solid color-mix(in srgb, ${agentAccent} 35%, transparent)`,
              }}
            >
              <span className="pulse-dot" style={{ background: agentAccent }} />
              <span
                className="text-xs"
                style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, color: agentAccent }}
              >
                {AGENTS[activeAgent].name} active
              </span>
              <button
                onClick={() => { setActiveAgent(null); onAgentClear(); }}
                className="text-white/40 hover:text-white/70 transition-colors text-xs ml-1"
              >×</button>
            </motion.div>
          ) : (
            <button
              onClick={() => setAutoRoute(v => !v)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-full transition-all"
              style={{
                background: autoRoute ? 'rgba(184,164,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${autoRoute ? 'rgba(184,164,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color: autoRoute ? 'var(--amethyst)' : 'rgba(245,244,248,0.5)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
              <span className="text-[11px]" style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                Auto-route: {autoRoute ? 'on' : 'off'}
              </span>
            </button>
          )}
        </div>

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
                {AGENT_ORDER.map(id => {
                  const agent = AGENTS[id];
                  const isActive = activeAgent === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveAgent(id);
                        setShowAgents(false);
                        setMessages([{
                          id: `welcome_${id}`,
                          role: 'assistant',
                          agent: id,
                          content: `${agent.name} active. ${agent.role}. What do you need?`,
                        }]);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.005]"
                      style={{
                        background: isActive ? `color-mix(in srgb, ${agent.accent} 13%, transparent)` : 'transparent',
                        border: isActive ? `1px solid color-mix(in srgb, ${agent.accent} 32%, transparent)` : '1px solid transparent',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-mono font-semibold"
                        style={{
                          background: `color-mix(in srgb, ${agent.accent} 15%, transparent)`,
                          color: agent.accent,
                          boxShadow: `0 0 12px color-mix(in srgb, ${agent.accent} 25%, transparent)`,
                        }}
                      >
                        {agent.glyph}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[#F5F4F8] text-sm font-medium" style={{ fontFamily: 'var(--font-ui)' }}>
                          {agent.name}
                        </p>
                        <p className="text-white/40 text-xs truncate" style={{ fontFamily: 'var(--font-ui)' }}>
                          {agent.role}
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
              Ask anything — your team is listening.
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt, i) => {
                const a = AGENTS[prompt.agent];
                return (
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
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-mono font-semibold"
                      style={{
                        background: `color-mix(in srgb, ${a.accent} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${a.accent} 30%, transparent)`,
                        color: a.accent,
                      }}
                    >
                      {a.glyph}
                    </span>
                    <span
                      className="text-white/70 text-sm flex-1"
                      style={{ fontFamily: 'var(--font-ui)' }}
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
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <AnimatePresence initial={false}>
              {messages.map(msg => {
                const msgAgent = msg.agent ? AGENTS[msg.agent] : currentAgent;
                const msgAccent = msg.agent ? AGENTS[msg.agent].accent : agentAccent;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[88%] px-4 py-3 rounded-2xl"
                      style={msg.role === 'user' ? {
                        background: 'linear-gradient(180deg, rgba(184,164,255,0.14) 0%, rgba(122,92,232,0.08) 100%)',
                        border: '1px solid rgba(184,164,255,0.22)',
                        borderBottomRightRadius: '6px',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid color-mix(in srgb, ${msgAccent} 12%, rgba(255,255,255,0.08))`,
                        borderBottomLeftRadius: '6px',
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span
                            className="pulse-dot"
                            style={{ background: msgAccent, opacity: msg.streaming ? 1 : 0.6 }}
                          />
                          <span
                            style={{
                              color: msgAccent, fontWeight: 600, fontFamily: 'var(--font-mono)',
                              fontSize: '0.66rem', letterSpacing: '0.12em',
                            }}
                          >
                            {msgAgent.name.toUpperCase()}
                          </span>
                          {msg.chainStep && (
                            <span
                              className="px-1.5 py-0.5 rounded"
                              style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                                letterSpacing: '0.1em', color: 'rgba(245,244,248,0.55)',
                                background: 'rgba(255,255,255,0.05)',
                              }}
                            >
                              {msg.chainStep.planName.toUpperCase()} · {msg.chainStep.step}/{msg.chainStep.total}
                            </span>
                          )}
                          {msg.streaming && (
                            <span className="inline-flex gap-0.5 ml-1">
                              {[0,1,2].map(i => (
                                <motion.span
                                  key={i}
                                  className="w-1 h-1 rounded-full"
                                  style={{ background: msgAccent }}
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
                        {msg.content || (msg.streaming ? '' : '…')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
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
              placeholder={activeAgent ? `Ask ${AGENTS[activeAgent].name}…` : 'Ask anything — I\'ll route you…'}
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
                  ? `linear-gradient(135deg, ${agentAccent} 0%, color-mix(in srgb, ${agentAccent} 70%, #000) 100%)`
                  : 'rgba(255,255,255,0.06)',
                boxShadow: input.trim() && !loading
                  ? `0 4px 16px color-mix(in srgb, ${agentAccent} 40%, transparent)`
                  : 'none',
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
