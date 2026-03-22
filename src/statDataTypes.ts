/** 与 MVU `stat_data` 对齐的局部类型（字段均为可选，便于安全读取） */
export type StatData = {
  全局信息?: {
    物理位置?: string;
    时间?: string;
  };
  主角?: {
    主角状态栏?: {
      HP值?: number;
      SP值?: number;
    };
    真气?: {
      是否可以修习真气?: boolean;
      真气名称?: string;
      真气效果?: string;
      真气层数?: number;
      真气修习进度?: number;
    };
    驾驶属性?: {
      APM?: number;
      神经同步率?: number;
    };
    当前驾驶机甲?: {
      当前驾驶机甲名称?: string;
      结构值?: number;
      装甲值?: number;
      装甲等级?: string;
    };
    资金?: {
      联邦币?: number;
      帝国币?: number;
    };
  };
};

/** UI 层使用的扁平展示数据 */
export type StatusDisplay = {
  locLine: string;
  /** 非空时顶栏优先显示游戏内时间，否则用实时 UTC */
  gameTime: string;
  callsign: string;
  hp: number;
  sp: number;
  maxHp: number;
  maxSp: number;
  apm: number;
  syncRate: number;
  qiName: string;
  qiTier: number;
  qiProgressPct: number;
  qiEffect: string;
  mechName: string;
  armorTierLabel: string;
  structureAp: number;
  armorValue: number;
  federal: number;
  imperial: number;
};
