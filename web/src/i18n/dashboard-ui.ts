import { useI18n } from "./context";
import type { Locale } from "./types";

export interface DashboardUiStrings {
  modelPicker: {
    defaultTitle: string;
    currentLabel: string;
    unknownCurrent: string;
    filterPlaceholder: string;
    savesToConfig: string;
    persistGlobal: string;
    loading: string;
    noMatches: string;
    noAuthenticatedProviders: string;
    modelsCount: (count: number) => string;
    pickProvider: string;
    noModelsMatch: string;
    noModelsListed: string;
    currentTag: string;
    switchAction: string;
  };
  modelsPage: {
    auxTasks: Record<string, { label: string; hint: string }>;
    tokenLegend: {
      cacheRead: string;
      reasoning: string;
      input: string;
      output: string;
    };
    capabilityBadges: {
      tools: string;
      vision: string;
      reasoning: string;
    };
    useAs: string;
    mainModel: string;
    auxiliaryTask: string;
    allAuxiliaryTasks: string;
    currentTag: string;
    mainBadge: string;
    auxiliaryBadge: string;
    contextShort: string;
    outputShort: string;
    auxModalTitle: string;
    resetAllToAuto: string;
    auxDescription: string;
    autoUseMainModel: string;
    providerDefault: string;
    change: string;
    resetAuxTitle: string;
    resetAuxDescription: string;
    resetAll: string;
    setAuxiliaryTitle: (label: string) => string;
    settingsTitle: string;
    appliesToNewSessions: string;
    tokenAnalyticsHiddenPrefix: string;
    tokenAnalyticsHiddenSuffix: string;
    unset: string;
    configure: string;
    setMainModelTitle: string;
    auxiliaryTasksTitle: string;
    overridesSummary: (overrideCount: number, totalCount: number) => string;
  };
  pluginsPage: {
    installed: (name: string) => string;
    installFailed: string;
    rescanFailed: string;
    saveFailed: string;
    actionFailed: string;
    removed: (name: string) => string;
    installPlaceholder: string;
    removeDescription: (name: string) => string;
  };
  cronPage: {
    fallbackJobTitle: string;
    scheduled: string;
    defaultProfile: string;
    profileLabel: string;
    allProfiles: string;
    promptScheduleRequired: string;
    stateLabels: Record<string, string>;
  };
  chatPage: {
    tokenUnavailable: string;
    authFailed: string;
    localhostOnly: string;
    copyRawTitle: string;
    copyRawAria: string;
    copyButtonCopied: string;
    copyButtonIdle: string;
    sessionEnded: string;
  };
  sidebar: {
    stateLabels: Record<string, string>;
    modelLabel: string;
    switchModel: string;
    reconnect: string;
    toolsLabel: string;
    noToolCallsYet: string;
    eventsDisconnected: string;
    eventsRejected: (code: number) => string;
    toolDefaultName: string;
  };
  toolCall: {
    runningTitle: string;
    errorAria: string;
    doneAria: string;
    sections: {
      context: string;
      streaming: string;
      diff: string;
      result: string;
      error: string;
    };
  };
  modelInfo: {
    loading: string;
    contextWindow: string;
    maxOutput: string;
    overrideAuto: (value: string) => string;
    autoDetected: string;
    badges: {
      tools: string;
      vision: string;
      reasoning: string;
    };
  };
  oauth: {
    failedToStartLogin: (error: string) => string;
    failedToLoadProviders: (error: string) => string;
    connected: (name: string) => string;
    tokenExchangeFailed: string;
    submitFailed: (error: string) => string;
    pollingFailed: (error: string) => string;
    disconnectDescription: (name: string) => string;
  };
}

const en: DashboardUiStrings = {
  modelPicker: {
    defaultTitle: "Switch Model",
    currentLabel: "Current",
    unknownCurrent: "(unknown)",
    filterPlaceholder: "Filter providers and models...",
    savesToConfig: "Saves to config.yaml and applies to new sessions.",
    persistGlobal: "Persist globally (otherwise this session only)",
    loading: "Loading...",
    noMatches: "No matches",
    noAuthenticatedProviders: "No authenticated providers",
    modelsCount: (count) => `${count} models`,
    pickProvider: "Pick a provider →",
    noModelsMatch: "No models match your filter",
    noModelsListed: "No models listed for this provider",
    currentTag: "current",
    switchAction: "Switch",
  },
  modelsPage: {
    auxTasks: {
      vision: { label: "Vision", hint: "Image analysis" },
      web_extract: { label: "Web Extract", hint: "Page summarization" },
      compression: { label: "Compression", hint: "Context compaction" },
      skills_hub: { label: "Skills Hub", hint: "Skill search" },
      approval: { label: "Approval", hint: "Smart auto-approve" },
      mcp: { label: "MCP", hint: "MCP tool routing" },
      title_generation: { label: "Title Gen", hint: "Session titles" },
      triage_specifier: {
        label: "Triage Specifier",
        hint: "Kanban spec fleshing",
      },
      kanban_decomposer: {
        label: "Kanban Decomposer",
        hint: "Task decomposition",
      },
      profile_describer: {
        label: "Profile Describer",
        hint: "Auto profile descriptions",
      },
      curator: { label: "Curator", hint: "Skill-usage review" },
    },
    tokenLegend: {
      cacheRead: "Cache Read",
      reasoning: "Reasoning",
      input: "Input",
      output: "Output",
    },
    capabilityBadges: {
      tools: "Tools",
      vision: "Vision",
      reasoning: "Reasoning",
    },
    useAs: "Use as",
    mainModel: "Main model",
    auxiliaryTask: "Auxiliary task",
    allAuxiliaryTasks: "All auxiliary tasks",
    currentTag: "current",
    mainBadge: "main",
    auxiliaryBadge: "aux",
    contextShort: "ctx",
    outputShort: "out",
    auxModalTitle: "Auxiliary Tasks",
    resetAllToAuto: "Reset all to auto",
    auxDescription:
      'Auxiliary tasks handle side-jobs like vision, session search, and compression. "auto" means "use the main model". Override per-task when you want a cheap or fast model for a specific job.',
    autoUseMainModel: "auto (use main model)",
    providerDefault: "(provider default)",
    change: "Change",
    resetAuxTitle: "Reset auxiliary models",
    resetAuxDescription:
      "Reset every auxiliary task to 'auto'? This overrides any per-task overrides you've set.",
    resetAll: "Reset all",
    setAuxiliaryTitle: (label) => `Set Auxiliary: ${label}`,
    settingsTitle: "Model Settings",
    appliesToNewSessions: "applies to new sessions",
    tokenAnalyticsHiddenPrefix:
      "Token and cost analytics are hidden because the local counts exclude auxiliary calls (compression, vision, web extract, ...) and provider retries, so they diverge from your provider bill. Enable",
    tokenAnalyticsHiddenSuffix: "to show the local debug estimate anyway.",
    unset: "(unset)",
    configure: "Configure",
    setMainModelTitle: "Set Main Model",
    auxiliaryTasksTitle: "Auxiliary tasks",
    overridesSummary: (overrideCount, totalCount) =>
      overrideCount > 0
        ? `${overrideCount} override${overrideCount > 1 ? "s" : ""} · ${
            totalCount - overrideCount
          } auto`
        : `${totalCount} tasks · all auto`,
  },
  pluginsPage: {
    installed: (name) => `${name} installed`,
    installFailed: "Install failed",
    rescanFailed: "Rescan failed",
    saveFailed: "Save failed",
    actionFailed: "Failed",
    removed: (name) => `${name} removed`,
    installPlaceholder: "owner/repo or https://...",
    removeDescription: (name) =>
      `This will remove the "${name}" plugin from your agent.`,
  },
  cronPage: {
    fallbackJobTitle: "Cron job",
    scheduled: "scheduled",
    defaultProfile: "default",
    profileLabel: "Profile",
    allProfiles: "All profiles",
    promptScheduleRequired: "Prompt and schedule are required",
    stateLabels: {
      enabled: "enabled",
      scheduled: "scheduled",
      paused: "paused",
      error: "error",
      completed: "completed",
      disabled: "disabled",
    },
  },
  chatPage: {
    tokenUnavailable:
      "Session token unavailable. Open this page through `hermes dashboard`, not directly.",
    authFailed: "Auth failed. Reload the page to refresh the session token.",
    localhostOnly: "Chat is only reachable from localhost.",
    copyRawTitle: "Copy last assistant response as raw markdown",
    copyRawAria: "Copy last assistant response",
    copyButtonCopied: "copied",
    copyButtonIdle: "copy last response",
    sessionEnded: "[session ended]",
  },
  sidebar: {
    stateLabels: {
      idle: "idle",
      connecting: "connecting",
      open: "live",
      closed: "closed",
      error: "error",
    },
    modelLabel: "model",
    switchModel: "switch model",
    reconnect: "reconnect",
    toolsLabel: "tools",
    noToolCallsYet: "no tool calls yet",
    eventsDisconnected: "events feed disconnected — tool calls may not appear",
    eventsRejected: (code) => `events feed rejected (${code}) — reload the page`,
    toolDefaultName: "tool",
  },
  toolCall: {
    runningTitle: "running",
    errorAria: "error",
    doneAria: "done",
    sections: {
      context: "context",
      streaming: "streaming",
      diff: "diff",
      result: "result",
      error: "error",
    },
  },
  modelInfo: {
    loading: "Loading model info...",
    contextWindow: "Context Window",
    maxOutput: "Max Output",
    overrideAuto: (value) => `(override — auto: ${value})`,
    autoDetected: "auto-detected",
    badges: {
      tools: "Tools",
      vision: "Vision",
      reasoning: "Reasoning",
    },
  },
  oauth: {
    failedToStartLogin: (error) => `Failed to start login: ${error}`,
    failedToLoadProviders: (error) => `Failed to load providers: ${error}`,
    connected: (name) => `${name} connected`,
    tokenExchangeFailed: "Token exchange failed",
    submitFailed: (error) => `Submit failed: ${error}`,
    pollingFailed: (error) => `Polling failed: ${error}`,
    disconnectDescription: (name) =>
      `This will remove the stored OAuth tokens for ${name}. You will need to re-authenticate to use it again.`,
  },
};

const zh: DashboardUiStrings = {
  modelPicker: {
    defaultTitle: "切换模型",
    currentLabel: "当前",
    unknownCurrent: "（未知）",
    filterPlaceholder: "筛选提供方和模型...",
    savesToConfig: "会保存到 config.yaml，并应用于新会话。",
    persistGlobal: "全局持久化（否则仅当前会话生效）",
    loading: "加载中...",
    noMatches: "无匹配结果",
    noAuthenticatedProviders: "没有已认证的提供方",
    modelsCount: (count) => `${count} 个模型`,
    pickProvider: "先选择一个提供方 →",
    noModelsMatch: "没有匹配筛选条件的模型",
    noModelsListed: "该提供方没有列出模型",
    currentTag: "当前",
    switchAction: "切换",
  },
  modelsPage: {
    auxTasks: {
      vision: { label: "视觉", hint: "图像分析" },
      web_extract: { label: "网页提取", hint: "页面摘要" },
      compression: { label: "压缩", hint: "上下文压缩" },
      skills_hub: { label: "技能中心", hint: "技能搜索" },
      approval: { label: "审批", hint: "智能自动批准" },
      mcp: { label: "MCP", hint: "MCP 工具路由" },
      title_generation: { label: "标题生成", hint: "会话标题" },
      triage_specifier: { label: "分诊细化", hint: "看板规格补全" },
      kanban_decomposer: { label: "看板拆解器", hint: "任务拆解" },
      profile_describer: { label: "配置描述器", hint: "自动生成配置描述" },
      curator: { label: "策展器", hint: "技能使用审查" },
    },
    tokenLegend: {
      cacheRead: "缓存读取",
      reasoning: "推理",
      input: "输入",
      output: "输出",
    },
    capabilityBadges: {
      tools: "工具",
      vision: "视觉",
      reasoning: "推理",
    },
    useAs: "设为",
    mainModel: "主模型",
    auxiliaryTask: "辅助任务",
    allAuxiliaryTasks: "所有辅助任务",
    currentTag: "当前",
    mainBadge: "主",
    auxiliaryBadge: "辅",
    contextShort: "上下文",
    outputShort: "输出",
    auxModalTitle: "辅助任务",
    resetAllToAuto: "全部重置为自动",
    auxDescription:
      "辅助任务用于处理视觉、会话搜索、压缩等侧边工作。`auto` 表示“使用主模型”。如果某个任务更适合更便宜或更快的模型，可以单独覆盖。",
    autoUseMainModel: "自动（使用主模型）",
    providerDefault: "（提供方默认）",
    change: "更改",
    resetAuxTitle: "重置辅助模型",
    resetAuxDescription:
      "要把所有辅助任务都重置为“自动”吗？这会覆盖你为单个任务设置的自定义值。",
    resetAll: "全部重置",
    setAuxiliaryTitle: (label) => `设置辅助任务：${label}`,
    settingsTitle: "模型设置",
    appliesToNewSessions: "应用于新会话",
    tokenAnalyticsHiddenPrefix:
      "Token 和费用分析默认隐藏，因为本地统计不包含辅助调用（压缩、视觉、网页提取等）和提供方重试，因此会与提供方账单不一致。启用",
    tokenAnalyticsHiddenSuffix: "后，仍可显示本地调试估算值。",
    unset: "（未设置）",
    configure: "配置",
    setMainModelTitle: "设置主模型",
    auxiliaryTasksTitle: "辅助任务",
    overridesSummary: (overrideCount, totalCount) =>
      overrideCount > 0
        ? `${overrideCount} 个覆盖 · ${totalCount - overrideCount} 个自动`
        : `${totalCount} 个任务 · 全部自动`,
  },
  pluginsPage: {
    installed: (name) => `${name} 已安装`,
    installFailed: "安装失败",
    rescanFailed: "重新扫描失败",
    saveFailed: "保存失败",
    actionFailed: "操作失败",
    removed: (name) => `${name} 已移除`,
    installPlaceholder: "owner/repo 或 https://...",
    removeDescription: (name) => `这会从你的代理中移除插件“${name}”。`,
  },
  cronPage: {
    fallbackJobTitle: "定时任务",
    scheduled: "已调度",
    defaultProfile: "默认",
    profileLabel: "多Agent配置",
    allProfiles: "所有多Agent配置",
    promptScheduleRequired: "提示词和调度都不能为空",
    stateLabels: {
      enabled: "已启用",
      scheduled: "已调度",
      paused: "已暂停",
      error: "错误",
      completed: "已完成",
      disabled: "已禁用",
    },
  },
  chatPage: {
    tokenUnavailable:
      "会话令牌不可用。请通过 `hermes dashboard` 打开此页面，而不是直接访问。",
    authFailed: "认证失败。请刷新页面以更新会话令牌。",
    localhostOnly: "聊天页面只能从 localhost 访问。",
    copyRawTitle: "将上一条助手回复复制为原始 Markdown",
    copyRawAria: "复制上一条助手回复",
    copyButtonCopied: "已复制",
    copyButtonIdle: "复制上一条回复",
    sessionEnded: "[会话已结束]",
  },
  sidebar: {
    stateLabels: {
      idle: "空闲",
      connecting: "连接中",
      open: "在线",
      closed: "已关闭",
      error: "错误",
    },
    modelLabel: "模型",
    switchModel: "切换模型",
    reconnect: "重新连接",
    toolsLabel: "工具",
    noToolCallsYet: "还没有工具调用",
    eventsDisconnected: "事件流已断开，工具调用可能不会显示",
    eventsRejected: (code) => `事件流被拒绝（${code}），请刷新页面`,
    toolDefaultName: "工具",
  },
  toolCall: {
    runningTitle: "运行中",
    errorAria: "错误",
    doneAria: "完成",
    sections: {
      context: "上下文",
      streaming: "流式输出",
      diff: "差异",
      result: "结果",
      error: "错误",
    },
  },
  modelInfo: {
    loading: "正在加载模型信息...",
    contextWindow: "上下文窗口",
    maxOutput: "最大输出",
    overrideAuto: (value) => `（手动覆盖，自动值：${value}）`,
    autoDetected: "自动检测",
    badges: {
      tools: "工具",
      vision: "视觉",
      reasoning: "推理",
    },
  },
  oauth: {
    failedToStartLogin: (error) => `启动登录失败：${error}`,
    failedToLoadProviders: (error) => `加载提供方失败：${error}`,
    connected: (name) => `${name} 已连接`,
    tokenExchangeFailed: "令牌交换失败",
    submitFailed: (error) => `提交失败：${error}`,
    pollingFailed: (error) => `轮询失败：${error}`,
    disconnectDescription: (name) =>
      `这会移除 ${name} 的已存 OAuth 令牌。之后如需继续使用，你需要重新认证。`,
  },
};

const zhHant: DashboardUiStrings = {
  ...zh,
  modelPicker: {
    ...zh.modelPicker,
    defaultTitle: "切換模型",
    currentLabel: "目前",
    filterPlaceholder: "篩選提供方與模型...",
    savesToConfig: "會儲存到 config.yaml，並套用到新會話。",
    persistGlobal: "全域持久化（否則僅目前會話生效）",
    noMatches: "無符合結果",
    noAuthenticatedProviders: "沒有已認證的提供方",
    modelsCount: (count) => `${count} 個模型`,
    pickProvider: "先選擇一個提供方 →",
    noModelsMatch: "沒有符合篩選條件的模型",
    noModelsListed: "此提供方沒有列出模型",
    switchAction: "切換",
  },
  modelsPage: {
    ...zh.modelsPage,
    auxTasks: {
      vision: { label: "視覺", hint: "影像分析" },
      web_extract: { label: "網頁擷取", hint: "頁面摘要" },
      compression: { label: "壓縮", hint: "上下文壓縮" },
      skills_hub: { label: "技能中心", hint: "技能搜尋" },
      approval: { label: "審批", hint: "智慧自動核准" },
      mcp: { label: "MCP", hint: "MCP 工具路由" },
      title_generation: { label: "標題生成", hint: "會話標題" },
      triage_specifier: { label: "分診細化", hint: "看板規格補全" },
      kanban_decomposer: { label: "看板拆解器", hint: "任務拆解" },
      profile_describer: { label: "設定描述器", hint: "自動產生設定描述" },
      curator: { label: "策展器", hint: "技能使用審查" },
    },
    tokenLegend: {
      cacheRead: "快取讀取",
      reasoning: "推理",
      input: "輸入",
      output: "輸出",
    },
    capabilityBadges: {
      tools: "工具",
      vision: "視覺",
      reasoning: "推理",
    },
    auxModalTitle: "輔助任務",
    resetAllToAuto: "全部重設為自動",
    auxDescription:
      "輔助任務用於處理視覺、會話搜尋、壓縮等側邊工作。`auto` 表示「使用主模型」。如果某個任務更適合更便宜或更快的模型，可以單獨覆寫。",
    autoUseMainModel: "自動（使用主模型）",
    resetAuxTitle: "重設輔助模型",
    resetAuxDescription:
      "要把所有輔助任務都重設為「自動」嗎？這會覆蓋你為單個任務設定的自訂值。",
    resetAll: "全部重設",
    setAuxiliaryTitle: (label) => `設定輔助任務：${label}`,
    settingsTitle: "模型設定",
    appliesToNewSessions: "套用到新會話",
    tokenAnalyticsHiddenPrefix:
      "Token 與費用分析預設隱藏，因為本地統計不包含輔助呼叫（壓縮、視覺、網頁擷取等）和提供方重試，因此會與提供方帳單不一致。啟用",
    tokenAnalyticsHiddenSuffix: "後，仍可顯示本地除錯估算值。",
    configure: "設定",
    setMainModelTitle: "設定主模型",
    overridesSummary: (overrideCount, totalCount) =>
      overrideCount > 0
        ? `${overrideCount} 個覆寫 · ${totalCount - overrideCount} 個自動`
        : `${totalCount} 個任務 · 全部自動`,
  },
  pluginsPage: {
    ...zh.pluginsPage,
    installed: (name) => `${name} 已安裝`,
    rescanFailed: "重新掃描失敗",
    removeDescription: (name) => `這會從你的代理中移除外掛「${name}」。`,
  },
  cronPage: {
    ...zh.cronPage,
    fallbackJobTitle: "排程任務",
    scheduled: "已排程",
    defaultProfile: "預設",
    profileLabel: "多 Agent 設定",
    allProfiles: "所有多 Agent 設定",
    promptScheduleRequired: "提示詞和排程都不能為空",
    stateLabels: {
      enabled: "已啟用",
      scheduled: "已排程",
      paused: "已暫停",
      error: "錯誤",
      completed: "已完成",
      disabled: "已停用",
    },
  },
  chatPage: {
    ...zh.chatPage,
    tokenUnavailable:
      "會話權杖不可用。請透過 `hermes dashboard` 開啟此頁面，而不是直接存取。",
    authFailed: "認證失敗。請重新整理頁面以更新會話權杖。",
    localhostOnly: "聊天頁面只能從 localhost 存取。",
    copyRawTitle: "將上一則助手回覆複製為原始 Markdown",
    copyRawAria: "複製上一則助手回覆",
    copyButtonCopied: "已複製",
    copyButtonIdle: "複製上一則回覆",
    sessionEnded: "[會話已結束]",
  },
  sidebar: {
    ...zh.sidebar,
    stateLabels: {
      idle: "閒置",
      connecting: "連線中",
      open: "在線",
      closed: "已關閉",
      error: "錯誤",
    },
    modelLabel: "模型",
    switchModel: "切換模型",
    reconnect: "重新連線",
    noToolCallsYet: "尚無工具呼叫",
    eventsDisconnected: "事件流已中斷，工具呼叫可能不會顯示",
    eventsRejected: (code) => `事件流被拒絕（${code}），請重新整理頁面`,
  },
  toolCall: {
    ...zh.toolCall,
    errorAria: "錯誤",
    sections: {
      context: "上下文",
      streaming: "串流輸出",
      diff: "差異",
      result: "結果",
      error: "錯誤",
    },
  },
  modelInfo: {
    ...zh.modelInfo,
    loading: "正在載入模型資訊...",
    contextWindow: "上下文視窗",
    maxOutput: "最大輸出",
    overrideAuto: (value) => `（手動覆寫，自動值：${value}）`,
    autoDetected: "自動偵測",
    badges: {
      tools: "工具",
      vision: "視覺",
      reasoning: "推理",
    },
  },
  oauth: {
    failedToStartLogin: (error) => `啟動登入失敗：${error}`,
    failedToLoadProviders: (error) => `載入提供方失敗：${error}`,
    connected: (name) => `${name} 已連線`,
    tokenExchangeFailed: "權杖交換失敗",
    submitFailed: (error) => `提交失敗：${error}`,
    pollingFailed: (error) => `輪詢失敗：${error}`,
    disconnectDescription: (name) =>
      `這會移除 ${name} 已儲存的 OAuth 權杖。之後如需繼續使用，你需要重新驗證。`,
  },
};

const DASHBOARD_UI_BY_LOCALE: Partial<Record<Locale, DashboardUiStrings>> = {
  en,
  zh,
  "zh-hant": zhHant,
};

export function getDashboardUi(locale: Locale | string): DashboardUiStrings {
  const normalized = String(locale || "en").toLowerCase();
  if (normalized.startsWith("zh-hant")) return zhHant;
  if (normalized.startsWith("zh")) return zh;
  return DASHBOARD_UI_BY_LOCALE[normalized as Locale] ?? en;
}

export function useDashboardUi(): DashboardUiStrings {
  const { locale } = useI18n();
  return getDashboardUi(locale);
}
