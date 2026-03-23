import type { StatData, StatusDisplay } from './statDataTypes';
import { rtGetChatMessages, rtGetLastMessageId, rtGetMvu, rtGetVariables } from './tavernRuntime';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function asStatData(v: unknown): StatData | undefined {
  if (!v || typeof v !== 'object') return undefined;
  return v as StatData;
}

/** 装甲等级 tier1 → T1 */
export function formatArmorTier(raw: string | undefined): string {
  if (!raw?.trim()) return '—';
  const m = /^tier\s*(\d)$/i.exec(raw.trim());
  return m ? `T${m[1]}` : raw.trim().toUpperCase();
}

/**
 * 自最新楼层向前，取最后一条 assistant 楼层 id（与创作提示词一致）。
 */
export function findLastAssistantMessageId(): number | null {
  const getLast = rtGetLastMessageId();
  const getMsgs = rtGetChatMessages();
  if (!getLast || !getMsgs) return null;
  try {
    const lastId = getLast();
    if (lastId < 0) return null;
    const msgs = getMsgs(`0-${lastId}`, { role: 'assistant' });
    if (!msgs.length) return null;
    return msgs[msgs.length - 1].message_id;
  } catch {
    return null;
  }
}

/**
 * 从指定消息楼层读取 stat_data：优先 Mvu.getMvuData，否则 getVariables。
 */
export function readStatDataFromMessage(messageId: number): StatData | undefined {
  const Mvu = rtGetMvu();
  if (Mvu) {
    try {
      const pack = Mvu.getMvuData({ type: 'message', message_id: messageId });
      const sd = asStatData(pack?.stat_data);
      if (sd) return sd;
    } catch {
      /* 降级 */
    }
  }
  const getVariables = rtGetVariables();
  if (getVariables) {
    try {
      const v = getVariables({ type: 'message', message_id: messageId });
      const sd = asStatData((v as { stat_data?: unknown }).stat_data);
      if (sd) return sd;
    } catch {
      /* */
    }
  }
  return undefined;
}

function asFiniteNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 将 stat_data 转为状态总览展示模型；缺字段时显示空态占位。 */
export function deriveStatusDisplay(stat: StatData | undefined): StatusDisplay {
  const g = stat?.全局信息;
  const 主角 = stat?.主角;
  const bar = 主角?.主角状态栏;
  const qi = 主角?.真气;
  const drive = 主角?.驾驶属性;
  const mech = 主角?.当前驾驶机甲;
  const funds = 主角?.资金;

  const hpRaw = asFiniteNumber(bar?.HP值);
  const spRaw = asFiniteNumber(bar?.SP值);
  const hp = hpRaw === null ? 0 : clamp(hpRaw, 0, 100);
  const sp = spRaw === null ? 0 : clamp(spRaw, 0, 100);

  const loc = g?.物理位置?.trim();
  const locLine = loc ? `LOC: ${loc}` : 'LOC: --';

  const apmRaw = asFiniteNumber(drive?.APM);
  const syncRaw = asFiniteNumber(drive?.神经同步率);
  const apm = apmRaw ?? 0;
  const sync = syncRaw === null ? 0 : clamp(syncRaw, 0, 100);

  const qiLayerRaw = asFiniteNumber(qi?.真气层数);
  const qiProgInput = asFiniteNumber(qi?.真气修习进度);
  const qiLayer = qiLayerRaw === null ? 0 : clamp(qiLayerRaw, 1, 10);
  const qiProgRaw = qiProgInput === null ? 0 : clamp(qiProgInput, 1, 10);
  const qiProgressPct = (qiProgRaw / 10) * 100;

  const mechName = mech?.当前驾驶机甲名称?.trim() || '--';
  const armorLbl = mech?.装甲等级 !== undefined ? formatArmorTier(String(mech.装甲等级)) : '--';

  const apRaw = asFiniteNumber(mech?.结构值);
  const armValRaw = asFiniteNumber(mech?.装甲值);
  const ap = apRaw ?? 0;
  const armVal = armValRaw ?? 0;

  return {
    locLine,
    gameTime: g?.时间?.trim() ?? '',
    callsign: 'RAVEN',
    hp,
    sp,
    maxHp: 100,
    maxSp: 100,
    apm,
    syncRate: sync,
    qiName: qi?.真气名称?.trim() || '--',
    qiTier: qiLayer,
    qiProgressPct,
    qiEffect: qi?.真气效果?.trim() || 'ERR: LINK LOST',
    mechName,
    armorTierLabel: armorLbl,
    structureAp: ap,
    armorValue: armVal,
    federal: asFiniteNumber(funds?.联邦币) ?? 0,
    imperial: asFiniteNumber(funds?.帝国币) ?? 0,
  };
}
