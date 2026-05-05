import { useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '../../hooks/useExtensionMessages.js';
import { vscode } from '../../vscodeApi.js';
import type { OfficeState } from '../engine/officeState.js';

interface ChatPanelProps {
  officeState: OfficeState;
  agents: number[];
  chatHistory: Record<number, ChatMessage[]>;
  selectedAgent: number | null;
}

export function ChatPanel({ officeState, agents, chatHistory, selectedAgent }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync activeId: follow selectedAgent if it changes and is in agents list
  useEffect(() => {
    if (agents.length === 0) {
      setActiveId(null);
      return;
    }
    if (selectedAgent !== null && agents.includes(selectedAgent)) {
      setActiveId(selectedAgent);
    } else if (activeId === null || !agents.includes(activeId)) {
      setActiveId(agents[agents.length - 1]);
    }
  }, [agents, selectedAgent, activeId]);

  // Auto-scroll to bottom when new messages arrive or active agent changes
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, activeId, isOpen]);

  if (agents.length === 0) return null;

  const messages = activeId !== null ? (chatHistory[activeId] ?? []) : [];
  const activeCh = activeId !== null ? officeState.characters.get(activeId) : null;
  const agentDisplayName = activeCh
    ? (activeCh.agentName ?? activeCh.folderName ?? `Agent ${activeId}`)
    : 'Agent';

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || activeId === null) return;
    vscode.postMessage({ type: 'sendMessageToAgent', id: activeId, text: trimmed });
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="absolute"
      style={{ bottom: 52, right: 8, zIndex: 45, width: 420, pointerEvents: 'auto' }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between border-2 border-border bg-bg cursor-pointer shadow-pixel"
        style={{ padding: '7px 12px', borderRadius: 0 }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center gap-8">
          <span
            style={{ fontSize: '12px', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}
          >
            CHAT
          </span>
          {activeId !== null && (
            <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{agentDisplayName}</span>
          )}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div
          className="border-2 border-t-0 border-border shadow-pixel"
          style={{ background: 'var(--color-bg)' }}
        >
          {/* Agent tabs (only when multiple agents) */}
          {agents.length > 1 && (
            <div
              className="flex overflow-x-auto border-b border-border"
              style={{ scrollbarWidth: 'none' }}
            >
              {agents.map((id) => {
                const ch = officeState.characters.get(id);
                const name = ch?.agentName ?? ch?.folderName ?? `Agent ${id}`;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveId(id)}
                    className="shrink-0 border-r border-border cursor-pointer"
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      background: activeId === id ? 'var(--color-bg-dark)' : 'var(--color-bg)',
                      color: activeId === id ? 'var(--color-text)' : 'var(--color-text-muted)',
                      borderRadius: 0,
                      whiteSpace: 'nowrap',
                      borderBottom: 'none',
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Message list */}
          <div ref={scrollRef} style={{ height: '50vh', overflowY: 'auto', padding: '12px 14px' }}>
            {messages.length === 0 ? (
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  padding: '32px 0',
                  letterSpacing: '0.04em',
                }}
              >
                No messages yet
              </div>
            ) : (
              messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)
            )}
          </div>

          {/* Input row */}
          <div
            className="border-t border-border flex items-end"
            style={{ padding: '8px 10px', gap: 8 }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message… (Enter to send, Shift+Enter for newline)"
              rows={2}
              style={{
                flex: 1,
                fontSize: '13px',
                background: 'var(--color-bg-dark)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: 0,
                padding: '7px 9px',
                resize: 'none',
                outline: 'none',
                maxHeight: 100,
                overflowY: 'auto',
                lineHeight: 1.45,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || activeId === null}
              className="border-2 border-border cursor-pointer shadow-pixel"
              style={{
                background: input.trim() ? 'var(--color-accent)' : 'var(--color-bg-dark)',
                color: input.trim() ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontSize: '16px',
                padding: '6px 14px',
                borderRadius: 0,
                flexShrink: 0,
                height: 40,
                lineHeight: 1,
              }}
            >
              ↵
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'system') {
    return (
      <div
        style={{
          fontSize: '12px',
          color: 'var(--color-warning)',
          textAlign: 'center',
          padding: '6px 0 8px',
          letterSpacing: '0.03em',
        }}
      >
        {msg.text}
      </div>
    );
  }
  const isUser = msg.role === 'user';
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: '11px',
          color: isUser ? 'var(--color-accent-bright)' : 'var(--color-status-active)',
          marginBottom: 4,
          letterSpacing: '0.08em',
          fontWeight: 'bold',
        }}
      >
        {isUser ? 'YOU' : 'CLAUDE'}
      </div>
      <div
        style={{
          fontSize: '13px',
          color: 'var(--color-text)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
          maxHeight: 320,
          overflowY: 'auto',
          paddingLeft: 10,
          borderLeft: isUser
            ? '2px solid var(--color-accent)'
            : '2px solid var(--color-status-active)',
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}
