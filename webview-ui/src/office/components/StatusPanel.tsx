import { useState } from 'react';

import {
  FUEL_COLOR_CRITICAL,
  FUEL_COLOR_DANGER,
  FUEL_COLOR_OK,
  FUEL_COLOR_WARN,
  MAX_CONTEXT_TOKENS,
  TEAM_LEAD_COLOR,
  TEAM_ROLE_COLOR,
  TOKEN_CRITICAL_THRESHOLD,
  TOKEN_DANGER_THRESHOLD,
  TOKEN_WARN_THRESHOLD,
  TOOL_OVERLAY_BG_ACTIVE,
  TOOL_OVERLAY_BG_PERMISSION,
} from '../../constants.js';
import type { SubagentCharacter } from '../../hooks/useExtensionMessages.js';
import type { OfficeState } from '../engine/officeState.js';
import type { ToolActivity } from '../types.js';

interface StatusPanelProps {
  officeState: OfficeState;
  agents: number[];
  agentTools: Record<number, ToolActivity[]>;
  subagentCharacters: SubagentCharacter[];
  onSelectAgent: (id: number) => void;
}

function getActivityText(
  agentId: number,
  agentTools: Record<number, ToolActivity[]>,
  isActive: boolean,
): string {
  const tools = agentTools[agentId];
  if (tools && tools.length > 0) {
    const activeTool = [...tools].reverse().find((t) => !t.done);
    if (activeTool) {
      if (activeTool.permissionWait) return 'Needs approval';
      return activeTool.status;
    }
    if (isActive) {
      const lastTool = tools[tools.length - 1];
      if (lastTool) return lastTool.status;
    }
  }
  return 'Idle';
}

function getFuelColor(ratio: number): string {
  if (ratio >= TOKEN_CRITICAL_THRESHOLD) return FUEL_COLOR_CRITICAL;
  if (ratio >= TOKEN_DANGER_THRESHOLD) return FUEL_COLOR_DANGER;
  if (ratio >= TOKEN_WARN_THRESHOLD) return FUEL_COLOR_WARN;
  return FUEL_COLOR_OK;
}

export function StatusPanel({
  officeState,
  agents,
  agentTools,
  subagentCharacters,
  onSelectAgent,
}: StatusPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (agents.length === 0) return null;

  const activeCount = agents.filter((id) => {
    const ch = officeState.characters.get(id);
    return ch?.isActive;
  }).length;

  return (
    <div
      className="absolute"
      style={{ top: 8, left: 8, zIndex: 45, width: 280, pointerEvents: 'auto' }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between border-2 border-border bg-bg cursor-pointer shadow-pixel"
        style={{ padding: '5px 10px', borderRadius: 0 }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center gap-6">
          <span
            className={`w-7 h-7 rounded-full ${activeCount > 0 ? 'pixel-pulse' : ''}`}
            style={{
              background: activeCount > 0 ? 'var(--color-status-active)' : 'var(--color-border)',
            }}
          />
          <span style={{ fontSize: '11px', color: TEAM_ROLE_COLOR, letterSpacing: '0.1em' }}>
            AGENTS
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {agents.length}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div
          className="border-2 border-t-0 border-border overflow-y-auto shadow-pixel"
          style={{ background: 'var(--color-bg)', maxHeight: '65vh' }}
        >
          {agents.map((id) => {
            const ch = officeState.characters.get(id);
            if (!ch) return null;

            const tools = agentTools[id];
            const hasPermission = tools?.some((t) => t.permissionWait && !t.done);
            const hasActiveTools = tools?.some((t) => !t.done);
            const isActive = ch.isActive;
            const activityText = getActivityText(id, agentTools, isActive);

            const dotColor = hasPermission
              ? 'var(--color-status-permission)'
              : isActive && hasActiveTools
                ? 'var(--color-status-active)'
                : null;

            const totalTokens = ch.inputTokens + ch.outputTokens;
            const tokenRatio = totalTokens / MAX_CONTEXT_TOKENS;
            const isTeamAgent = !!ch.teamName;

            const mySubagents = subagentCharacters.filter((s) => s.parentAgentId === id);

            const displayName = ch.agentName ?? ch.folderName ?? `Agent ${id}`;
            const showRoleTag = ch.teamName && (ch.isTeamLead || ch.agentName);

            return (
              <div
                key={id}
                className="border-b border-border last:border-b-0 cursor-pointer"
                style={{
                  background: hasPermission
                    ? TOOL_OVERLAY_BG_PERMISSION
                    : isActive && hasActiveTools
                      ? TOOL_OVERLAY_BG_ACTIVE
                      : undefined,
                  borderLeft: dotColor ? `3px solid ${dotColor}` : '3px solid transparent',
                }}
                onClick={() => onSelectAgent(id)}
              >
                <div style={{ padding: '8px 10px 8px 8px' }}>
                  {/* Name row */}
                  <div className="flex items-center gap-6">
                    <span
                      className={`w-7 h-7 rounded-full shrink-0 ${isActive && !hasPermission && hasActiveTools ? 'pixel-pulse' : ''}`}
                      style={{
                        background: dotColor ?? 'var(--color-border)',
                        opacity: dotColor ? 1 : 0.4,
                      }}
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-baseline gap-6 flex-wrap">
                        {showRoleTag && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: ch.isTeamLead ? TEAM_LEAD_COLOR : TEAM_ROLE_COLOR,
                              fontWeight: ch.isTeamLead ? 'bold' : undefined,
                              letterSpacing: '0.08em',
                              flexShrink: 0,
                            }}
                          >
                            {ch.isTeamLead ? 'LEAD' : ch.agentName?.toUpperCase()}
                          </span>
                        )}
                        <span
                          className="overflow-hidden text-ellipsis whitespace-nowrap"
                          style={{
                            fontSize: '14px',
                            color: 'var(--color-text)',
                            fontWeight: 'bold',
                          }}
                        >
                          {displayName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity text */}
                  <div
                    className="overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{
                      fontSize: '12px',
                      color: hasPermission
                        ? 'var(--color-status-permission)'
                        : isActive && hasActiveTools
                          ? 'var(--color-status-active)'
                          : 'var(--color-text-muted)',
                      marginTop: 4,
                      paddingLeft: 13,
                    }}
                    title={activityText}
                  >
                    {activityText}
                  </div>

                  {/* Folder name (when different from displayName) */}
                  {ch.folderName && ch.agentName && ch.folderName !== displayName && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--color-text-muted)',
                        marginTop: 2,
                        paddingLeft: 13,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ch.folderName}
                    </div>
                  )}

                  {/* Token bar */}
                  {isTeamAgent && totalTokens > 0 && (
                    <div
                      className="flex items-center gap-6"
                      style={{ marginTop: 6, paddingLeft: 13 }}
                      title={`${Math.round(tokenRatio * 100)}% context used (${(totalTokens / 1000).toFixed(0)}k / ${(MAX_CONTEXT_TOKENS / 1000).toFixed(0)}k tokens)`}
                    >
                      <div style={{ flex: 1, height: 4, background: 'var(--color-bg-dark)' }}>
                        <div
                          style={{
                            width: `${Math.min(tokenRatio * 100, 100)}%`,
                            height: '100%',
                            background: getFuelColor(tokenRatio),
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {Math.round(tokenRatio * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Sub-agents */}
                  {mySubagents.length > 0 && (
                    <div style={{ marginTop: 4, paddingLeft: 13 }}>
                      {mySubagents.map((sub) => {
                        const subCh = officeState.characters.get(sub.id);
                        const subHasPermission = subCh?.bubbleType === 'permission';
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center gap-4"
                            style={{ marginTop: 3 }}
                          >
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--color-text-muted)',
                                flexShrink: 0,
                              }}
                            >
                              └
                            </span>
                            <span
                              className="overflow-hidden text-ellipsis whitespace-nowrap"
                              style={{
                                fontSize: '11px',
                                fontStyle: 'italic',
                                color: subHasPermission
                                  ? 'var(--color-status-permission)'
                                  : 'var(--color-text-muted)',
                              }}
                            >
                              {subHasPermission ? 'Needs approval' : sub.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
