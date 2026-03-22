import type { StatData } from './statDataTypes';

/** 通讯频道固定七人，与变量 `stat_data.红颜[姓名]` 对齐 */
export const ROMANCE_NAMES = ['邰鸾', '林芿', '简水儿', '南相美', '利荔', '钟烟花', '曹奕奕'] as const;

const GARAGE_SLOT_ORDER = [
  '躯干单元',
  '能源单元',
  '电子战单元',
  '近身战单元',
  '火力单元',
  '机动单元',
  '特质装配',
] as const;

export type GarageEquippedRow = { slot: string; label: string; name: string };
export type GaragePartAvailable = { key: string; type: string; name: string };
export type GarageOverviewRow = { label: string; value: string | number };

export type RomanceRow = {
  id: string;
  name: string;
  affinity: number;
  herMech: string;
};

export type MissionRow = {
  id: string;
  title: string;
  objective: string;
  progress: string;
  reward: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** 机库整备：当前驾驶机甲对应泊位、装配槽、可用件、数值总览 */
export function garageFromStat(stat: StatData | undefined): {
  equipped: GarageEquippedRow[];
  available: GaragePartAvailable[];
  overview: GarageOverviewRow[];
  berthDisplayName: string;
} {
  const 机库 = stat?.机库;
  const curName = stat?.主角?.当前驾驶机甲?.当前驾驶机甲名称?.trim() ?? '';
  const berths = 机库?.机甲泊位;

  let template: Record<string, unknown> | undefined;
  let berthDisplayName = curName || '—';

  if (berths && typeof berths === 'object') {
    const b = berths as Record<string, Record<string, unknown>>;
    if (curName && b[curName]) {
      template = b[curName];
      berthDisplayName = curName;
    } else {
      const keys = Object.keys(b);
      if (keys.length > 0) {
        berthDisplayName = keys[0];
        template = b[keys[0]];
      }
    }
  }

  const 机甲构建 = (template?.机甲构建 as Record<string, Record<string, unknown>> | undefined) ?? {};
  const equipped: GarageEquippedRow[] = GARAGE_SLOT_ORDER.map(slot => {
    const u = 机甲构建[slot] as { 单元类型?: string; 单位名称?: string } | undefined;
    const name = u?.单位名称?.trim();
    return {
      slot,
      label: (u?.单元类型 as string) || slot,
      name: name && name.length > 0 ? name : '（空槽）',
    };
  });

  const rawAvail = 机库?.可用机甲部件;
  const available: GaragePartAvailable[] = [];
  if (rawAvail && typeof rawAvail === 'object') {
    for (const [key, val] of Object.entries(rawAvail)) {
      const u = val as { 单元类型?: string; 单位名称?: string };
      available.push({
        key,
        type: String(u?.单元类型 ?? '部件'),
        name: String(u?.单位名称 ?? key),
      });
    }
  }

  const mechNow = stat?.主角?.当前驾驶机甲;
  const vo = template?.数值总览 as
    | { 机甲代数?: number; 推重比?: number; 续航回合数?: number; 外观描述?: string }
    | undefined;

  const overview: GarageOverviewRow[] = [];
  if (mechNow?.结构值 !== undefined) overview.push({ label: '结构值', value: Number(mechNow.结构值) });
  if (mechNow?.装甲值 !== undefined) overview.push({ label: '装甲值', value: Number(mechNow.装甲值) });
  if (vo?.机甲代数 !== undefined) overview.push({ label: '机甲代数', value: vo.机甲代数 });
  if (vo?.推重比 !== undefined) overview.push({ label: '推重比', value: Number(vo.推重比).toFixed(2) });
  if (vo?.续航回合数 !== undefined) overview.push({ label: '续航回合数', value: vo.续航回合数 });
  if (vo?.外观描述?.trim()) overview.push({ label: '外观', value: vo.外观描述.trim() });

  return { equipped, available, overview, berthDisplayName };
}

export function romanceRowsFromStat(stat: StatData | undefined): RomanceRow[] {
  const 红颜 = stat?.红颜 ?? {};
  return ROMANCE_NAMES.map(name => {
    const row = 红颜[name];
    return {
      id: name,
      name,
      affinity: clamp(Number(row?.红颜好感度 ?? 0), 0, 100),
      herMech: row?.她的机甲?.trim() || '—',
    };
  });
}

export function missionsFromStat(stat: StatData | undefined): MissionRow[] {
  const panel = stat?.任务面板;
  if (!panel || typeof panel !== 'object') return [];
  return Object.entries(panel).map(([title, v]) => ({
    id: title,
    title,
    objective: v?.任务目标?.trim() || '—',
    progress: v?.任务进度?.trim() || '—',
    reward: v?.任务奖励?.trim() || '—',
  }));
}
