/**
 * SillyTavern / 酒馆助手宿主在 iframe 中注入的全局 API（构建时占位；运行时由宿主提供）。
 */
declare function getLastMessageId(): number;

declare function getChatMessages(
  range: string | number,
  option?: { role?: 'all' | 'system' | 'assistant' | 'user' },
): Array<{ message_id: number; role: string; message: string }>;

declare function getVariables(option: { type: 'message'; message_id: number }): Record<string, unknown>;

interface MvuHostApi {
  getMvuData: (options: { type: 'message'; message_id: number | 'latest' }) => { stat_data?: unknown };
  events: { VARIABLE_UPDATE_ENDED: string };
}

/** MVU 未安装或未注入时为 undefined */
declare const Mvu: MvuHostApi | undefined;

declare const tavern_events: {
  MESSAGE_UPDATED: string;
  CHARACTER_MESSAGE_RENDERED: string;
  MESSAGE_RECEIVED: string;
};

declare function eventOn(event: string, listener: (...args: unknown[]) => void): { stop: () => void };
