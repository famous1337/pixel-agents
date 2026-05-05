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
      style={{ bottom: 52, right: 8, zIndex: 45, width: 300, pointerEvents: 'auto' }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between border-2 border-border bg-bg cursor-pointer shadow-pixel"
        style={{ padding: '5px 10px', borderRadius: 0 }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center gap-6">
          <span
            style={{ fontSize: '11px', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}
          >
            CHAT
          </span>
          {activeId !== null && (
            <span style={{ fontSize: '11px', color: 'var(--color-text)' }}>{agentDisplayName}</span>
          )}
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
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
                      padding: '4px 10px',
                      fontSize: '10px',
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
          <div
            ref={scrollRef}
            style={{ maxHeight: '42vh', overflowY: 'auto', padding: '8px 10px' }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  padding: '20px 0',
                  letterSpacing: '0.05em',
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
            style={{ padding: '6px 8px', gap: 6 }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message… (Enter to send)"
              rows={1}
              style={{
                flex: 1,
                fontSize: '12px',
                background: 'var(--color-bg-dark)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: 0,
                padding: '5px 7px',
                resize: 'none',
                outline: 'none',
                maxHeight: 72,
                overflowY: 'auto',
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || activeId === null}
              className="border-2 border-border cursor-pointer shadow-pixel"
              style={{
                background: input.trim() ? 'var(--color-accent)' : 'var(--color-bg-dark)',
                color: input.trim() ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontSize: '14px',
                padding: '4px 10px',
                borderRadius: 0,
                flexShrink: 0,
                height: 30,
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
  const isUser = msg.role === 'user';
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: '10px',
          color: isUser ? 'var(--color-accent-bright)' : 'var(--color-status-active)',
          marginBottom: 3,
          letterSpacing: '0.08em',
          fontWeight: 'bold',
        }}
      >
        {isUser ? 'YOU' : 'CLAUDE'}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--color-text)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.5,
          maxHeight: 240,
          overflowY: 'auto',
          paddingLeft: 8,
          borderLeft: `2px solid ${isUser ? 'var(--color-accent)' : 'var(--color-status-active)'}`,
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}
