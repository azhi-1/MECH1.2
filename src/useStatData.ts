import { useCallback, useEffect, useState } from 'react';
import type { StatData, StatusDisplay } from './statDataTypes';
import {
  deriveStatusDisplay,
  findLastAssistantMessageId,
  readStatDataFromMessage,
} from './statDataBridge';

function isTavernHost(): boolean {
  return typeof getLastMessageId === 'function';
}

function asStatDataLoose(v: unknown): StatData | undefined {
  if (!v || typeof v !== 'object') return undefined;
  return v as StatData;
}

export function useStatData(pollMs = 900) {
  const [statData, setStatData] = useState<StatData | undefined>(undefined);
  const [display, setDisplay] = useState<StatusDisplay>(() => deriveStatusDisplay(undefined));
  const [anchorId, setAnchorId] = useState<number | null>(null);
  const [hostConnected] = useState(() => isTavernHost());

  const refreshFromMessages = useCallback(() => {
    const id = findLastAssistantMessageId();
    setAnchorId(id);
    if (id === null) {
      setStatData(undefined);
      setDisplay(deriveStatusDisplay(undefined));
      return;
    }
    const raw = readStatDataFromMessage(id);
    setStatData(raw);
    setDisplay(deriveStatusDisplay(raw));
  }, []);

  useEffect(() => {
    refreshFromMessages();

    const timer =
      typeof window !== 'undefined' ? window.setInterval(refreshFromMessages, pollMs) : 0;

    const stops: Array<{ stop: () => void }> = [];

    if (typeof eventOn === 'function') {
      try {
        stops.push(eventOn(tavern_events.MESSAGE_UPDATED, refreshFromMessages));
        stops.push(eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, refreshFromMessages));
        stops.push(eventOn(tavern_events.MESSAGE_RECEIVED, refreshFromMessages));
      } catch {
        /* 非宿主环境 */
      }
    }

    if (typeof eventOn === 'function' && typeof Mvu !== 'undefined' && Mvu?.events) {
      try {
        stops.push(
          eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (...args: unknown[]) => {
            const variables = args[0] as { stat_data?: unknown } | undefined;
            const sd = asStatDataLoose(variables?.stat_data);
            setStatData(sd);
            setDisplay(deriveStatusDisplay(sd));
          }),
        );
      } catch {
        /* */
      }
    }

    return () => {
      if (timer) window.clearInterval(timer);
      stops.forEach(s => {
        try {
          s.stop();
        } catch {
          /* */
        }
      });
    };
  }, [pollMs, refreshFromMessages]);

  return { statData, display, anchorMessageId: anchorId, hostConnected, refresh: refreshFromMessages };
}
