/**
 * 一律从 globalThis 取酒馆助手注入的 API，避免直接写 `tavern_events` 等标识符：
 * 在部分 iframe / 打包环境下这些名字并非全局绑定，会直接 ReferenceError 导致整页白屏。
 */
const G = () => globalThis as Record<string, unknown>;

export type ChatMessageLite = { message_id: number; role: string; message: string };

export function rtGetLastMessageId(): (() => number) | undefined {
  const f = G()['getLastMessageId'];
  return typeof f === 'function' ? (f as () => number) : undefined;
}

export function rtGetChatMessages():
  | ((range: string | number, opt?: { role?: string }) => ChatMessageLite[])
  | undefined {
  const f = G()['getChatMessages'];
  return typeof f === 'function' ? (f as (r: string | number, o?: { role?: string }) => ChatMessageLite[]) : undefined;
}

export function rtGetVariables():
  | ((opt: { type: 'message'; message_id: number }) => Record<string, unknown>)
  | undefined {
  const f = G()['getVariables'];
  return typeof f === 'function' ? (f as (o: { type: 'message'; message_id: number }) => Record<string, unknown>) : undefined;
}

export type MvuLite = {
  getMvuData: (options: { type: 'message'; message_id: number | 'latest' }) => { stat_data?: unknown };
  events: { VARIABLE_UPDATE_ENDED: string };
};

export function rtGetMvu(): MvuLite | undefined {
  const m = G()['Mvu'];
  if (!m || typeof m !== 'object') return undefined;
  const api = m as MvuLite;
  if (typeof api.getMvuData !== 'function' || !api.events) return undefined;
  return api;
}

export type TavernEventsLite = {
  MESSAGE_UPDATED: string;
  CHARACTER_MESSAGE_RENDERED: string;
  MESSAGE_RECEIVED: string;
};

export function rtGetTavernEvents(): TavernEventsLite | undefined {
  const t = G()['tavern_events'];
  if (!t || typeof t !== 'object') return undefined;
  return t as TavernEventsLite;
}

export function rtEventOn():
  | ((event: string, listener: (...args: unknown[]) => void) => { stop: () => void })
  | undefined {
  const f = G()['eventOn'];
  return typeof f === 'function' ? (f as (e: string, l: (...a: unknown[]) => void) => { stop: () => void }) : undefined;
}
