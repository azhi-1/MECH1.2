import type { StatData, StatusDisplay } from './statDataTypes';

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
  if (typeof getLastMessageId !== 'function' || typeof getChatMessages !== 'function') {
    return null;
  }
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) return null;
    const msgs = getChatMessages(`0-${lastId}`, { role: 'assistant' });
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
  if (typeof Mvu !== 'undefined' && Mvu?.getMvuData) {
    try {
      const pack = Mvu.getMvuData({ type: 'message', message_id: messageId });
      const sd = asStatData(pack?.stat_data);
      if (sd) return sd;
    } catch {
      /* 降级 */
    }
  }
  if (typeof getVariables === 'function') {
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

const MOCK_FALLBACK: StatusDisplay = {
  locLine: 'LOC: SECTOR 4 - RUBICON',
  gameTime: '',
  callsign: 'RAVEN',
  hp: 100,
  sp: 85,
  maxHp: 100,
  maxSp: 100,
  apm: 342,
  syncRate: 89.5,
  qiName: '虚空凝视',
  qiTier: 4,
  qiProgressPct: 78,
  qiEffect: '神经同步率上限突破 +15%',
  mechName: 'LOADER 4',
  armorTierLabel: 'T3',
  structureAp: 9030,
  armorValue: 1083,
  federal: 450200,
  imperial: 12050,
};

/** 将 stat_data 转为状态总览用展示模型；缺字段时回退到内置 Mock（本地预览）。 */
export function deriveStatusDisplay(stat: StatData | undefined): StatusDisplay {
  const g = stat?.全局信息;
  const 主角 = stat?.主角;
  const bar = 主角?.主角状态栏;
  const qi = 主角?.真气;
  const drive = 主角?.驾驶属性;
  const mech = 主角?.当前驾驶机甲;
  const funds = 主角?.资金;

  const hp = bar?.HP值 !== undefined ? clamp(Number(bar.HP值), 0, 100) : MOCK_FALLBACK.hp;
  const sp = bar?.SP值 !== undefined ? clamp(Number(bar.SP值), 0, 100) : MOCK_FALLBACK.sp;

  const loc = g?.物理位置?.trim();
  const locLine = loc ? `LOC: ${loc}` : MOCK_FALLBACK.locLine;

  const apm = drive?.APM !== undefined ? Number(drive.APM) : MOCK_FALLBACK.apm;
  const sync =
    drive?.神经同步率 !== undefined ? clamp(Number(drive.神经同步率), 0, 100) : MOCK_FALLBACK.syncRate;

  const qiLayer = qi?.真气层数 !== undefined ? clamp(Number(qi.真气层数), 1, 10) : MOCK_FALLBACK.qiTier;
  const qiProgRaw =
    qi?.真气修习进度 !== undefined ? clamp(Number(qi.真气修习进度), 1, 10) : MOCK_FALLBACK.qiProgressPct / 10;
  const qiProgressPct = (qiProgRaw / 10) * 100;

  const mechName = mech?.当前驾驶机甲名称?.trim() || MOCK_FALLBACK.mechName;
  const armorLbl =
    mech?.装甲等级 !== undefined ? formatArmorTier(String(mech.装甲等级)) : MOCK_FALLBACK.armorTierLabel;

  const ap = mech?.结构值 !== undefined ? Number(mech.结构值) : MOCK_FALLBACK.structureAp;
  const armVal = mech?.装甲值 !== undefined ? Number(mech.装甲值) : MOCK_FALLBACK.armorValue;

  return {
    locLine,
    gameTime: g?.时间?.trim() ?? '',
    callsign: MOCK_FALLBACK.callsign,
    hp,
    sp,
    maxHp: 100,
    maxSp: 100,
    apm,
    syncRate: sync,
    qiName: qi?.真气名称?.trim() || MOCK_FALLBACK.qiName,
    qiTier: qiLayer,
    qiProgressPct,
    qiEffect: qi?.真气效果?.trim() || MOCK_FALLBACK.qiEffect,
    mechName,
    armorTierLabel: armorLbl,
    structureAp: ap,
    armorValue: armVal,
    federal: funds?.联邦币 !== undefined ? Number(funds.联邦币) : MOCK_FALLBACK.federal,
    imperial: funds?.帝国币 !== undefined ? Number(funds.帝国币) : MOCK_FALLBACK.imperial,
  };
}
