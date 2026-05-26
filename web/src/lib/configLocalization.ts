import type { Translations } from "@/i18n/types";

const ZH_CATEGORY_OVERRIDES: Record<string, string> = {
  bedrock: "Bedrock",
  browser: "浏览器",
  curator: "策展器",
  gateway: "网关",
  kanban: "看板",
  lsp: "LSP",
  matrix: "Matrix",
  mattermost: "Mattermost",
  model_catalog: "模型目录",
  openrouter: "OpenRouter",
  secrets: "密钥",
  sessions: "会话",
  slack: "Slack",
  tool_loop_guardrails: "工具循环护栏",
  tool_output: "工具输出",
  updates: "更新",
  web: "Web",
  x_search: "X 搜索",
};

const ZH_LABEL_OVERRIDES: Record<string, string> = {
  model: "模型",
  model_context_length: "模型上下文长度",
  fallback_providers: "回退提供方",
  toolsets: "工具集",
  file_read_max_chars: "文件读取最大字符数",
  prefill_messages_file: "预填消息文件",
  timezone: "时区",
};

const ZH_DESCRIPTION_OVERRIDES: Record<string, string> = {
  "Default model (e.g. anthropic/claude-sonnet-4.6)":
    "默认模型（例如 anthropic/claude-sonnet-4.6）",
  "Context window override (0 = auto-detect from model metadata)":
    "上下文窗口覆盖值（0 = 根据模型元数据自动检测）",
  "Fallback Providers": "回退提供方",
  Toolsets: "工具集",
  "Dangerous command approval mode": "危险命令审批模式",
  "Log level for agent.log": "agent.log 的日志级别",
  "Memory provider plugin": "记忆提供方插件",
  "Command Allowlist": "命令允许列表",
  "Security → Tirith Enabled": "安全 → Tirith 启用",
  "Security → Tirith Fail Open": "安全 → Tirith 故障放行",
  "Security → Tirith Path": "安全 → Tirith 路径",
  "Security → Tirith Timeout": "安全 → Tirith 超时",
  "Terminal execution backend": "终端执行后端",
  "Modal sandbox mode": "Modal 沙箱模式",
  "Vercel Sandbox runtime": "Vercel 沙箱运行时",
  "API service tier (OpenAI/Anthropic)": "API 服务层级（OpenAI/Anthropic）",
  "Reasoning effort for delegated subagents": "委派子代理的推理强度",
  "How resumed sessions display history": "恢复会话时的历史显示方式",
  "Input behavior while agent is running": "代理运行时的输入行为",
  "CLI visual theme": "CLI 视觉主题",
  "Web dashboard visual theme": "Web 仪表盘视觉主题",
  "Text-to-speech provider": "文字转语音提供方",
  "Speech-to-text provider": "语音转文字提供方",
  "Simulated typing delay mode": "模拟打字延迟模式",
  "Context management engine": "上下文管理引擎",
};

const ZH_TOKEN_OVERRIDES: Record<string, string> = {
  abort: "中止",
  accept: "接受",
  access: "访问",
  acked: "已确认",
  actions: "动作",
  adopt: "接管",
  advisories: "安全公告",
  allow: "允许",
  allowed: "允许",
  allowlist: "允许列表",
  after: "后",
  agent: "代理",
  analytics: "分析",
  any: "任意",
  api: "API",
  approval: "审批",
  approvals: "审批",
  approve: "批准",
  archive: "归档",
  args: "参数",
  assignee: "负责人",
  assistant: "助手",
  attachment: "附件",
  audio: "音频",
  auth: "认证",
  auto: "自动",
  auxiliary: "辅助",
  backfill: "回填",
  backup: "备份",
  backend: "后端",
  base: "基础",
  bashrc: "Bashrc",
  bedrock: "Bedrock",
  beep: "提示音",
  bell: "铃声",
  bit: "位",
  bitwarden: "Bitwarden",
  blocklist: "阻止列表",
  boolean: "布尔",
  browser: "浏览器",
  busy: "忙碌",
  bytes: "字节",
  cache: "缓存",
  caching: "缓存",
  camofox: "Camofox",
  catalog: "目录",
  cdp: "CDP",
  channels: "频道",
  char: "字符",
  chars: "字符数",
  chats: "聊天",
  checkpoints: "检查点",
  child: "子",
  children: "子项",
  clarif: "澄清",
  clarify: "澄清",
  clarif_timeout: "澄清超时",
  claude: "Claude",
  cli: "CLI",
  code: "代码",
  coding: "编码",
  collapse: "折叠",
  command: "命令",
  compact: "紧凑",
  complete: "完成",
  compression: "压缩",
  concurrent: "并发",
  config: "配置",
  confirm: "确认",
  container: "容器",
  context: "上下文",
  continue: "继续",
  copy: "复制",
  cost: "成本",
  count: "数量",
  cpu: "CPU",
  cron: "定时任务",
  cwd: "CWD",
  created: "创建",
  dangerous: "危险",
  dashboard: "仪表盘",
  daytona: "Daytona",
  days: "天",
  debug: "调试",
  decompose: "拆解",
  decomposer: "拆解器",
  delegat: "委派",
  delegated: "委派",
  delegation: "委派",
  delete: "删除",
  delivery: "投递",
  depth: "深度",
  describer: "描述器",
  destructive: "破坏性",
  device: "设备",
  dialog: "对话框",
  diffs: "差异",
  dirs: "目录",
  disabled: "已禁用",
  disk: "磁盘",
  discord: "Discord",
  discover: "发现",
  discovery: "发现",
  dispatch: "调度",
  display: "显示",
  delay: "延迟",
  dm: "私信",
  docker: "Docker",
  domains: "域名",
  download: "下载",
  drain: "排空",
  duration: "时长",
  edge: "Edge",
  effort: "强度",
  elevenlabs: "ElevenLabs",
  enabled: "启用",
  enforcement: "强制",
  engine: "引擎",
  env: "环境变量",
  epheral: "临时",
  ephemeral: "临时",
  exact: "精确",
  exchanges: "交换轮次",
  execution: "执行",
  existing: "现有",
  extract: "提取",
  external: "外部",
  extra: "额外",
  fail: "失败",
  failure: "失败",
  fallback: "回退",
  fields: "字段",
  file: "文件",
  files: "文件",
  filter: "筛选",
  final: "最终",
  first: "前",
  footer: "页脚",
  force: "强制",
  forward: "转发",
  free: "自由",
  fresh: "新鲜",
  freshness: "新鲜度",
  gateway: "网关",
  generation: "生成",
  goals: "目标",
  guard: "保护",
  guardrail: "护栏",
  guardrails: "护栏",
  guild: "服务器",
  hard: "硬性",
  history: "历史",
  hooks: "钩子",
  host: "宿主",
  hours: "小时",
  hub: "中心",
  human: "人工",
  hygiene: "卫生",
  id: "ID",
  identifier: "标识",
  idempotent: "幂等",
  idle: "空闲",
  image: "图像",
  inactivity: "空闲",
  indicator: "指示器",
  init: "初始化",
  inline: "内联",
  input: "输入",
  install: "安装",
  installs: "安装",
  inherit: "继承",
  interval: "间隔",
  interim: "中间",
  ipv4: "IPv4",
  iterations: "迭代次数",
  jobs: "任务",
  json: "JSON",
  kanban: "看板",
  keep: "保留",
  key: "密钥",
  language: "语言",
  last: "后",
  lazy: "懒加载",
  length: "长度",
  level: "级别",
  limit: "限制",
  line: "行",
  lines: "行数",
  list: "列表",
  local: "本地",
  log: "日志",
  logging: "日志",
  loop: "循环",
  low: "低",
  lsp: "LSP",
  managed: "托管",
  management: "管理",
  markdown: "Markdown",
  matrix: "Matrix",
  mattermost: "Mattermost",
  max: "最大",
  mb: "MB",
  mcp: "MCP",
  media: "媒体",
  memory: "记忆",
  mention: "提及",
  message: "消息",
  messages: "消息",
  metadata: "元数据",
  min: "最小",
  ms: "毫秒",
  mistral: "Mistral",
  modal: "Modal",
  mode: "模式",
  model: "模型",
  monitor: "监控",
  mount: "挂载",
  mutation: "变更",
  n: "N",
  network: "网络",
  neutts: "NeuTTS",
  no: "无",
  notify: "通知",
  open: "打开",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  only: "仅",
  options: "选项",
  orphans: "孤儿项",
  orchestrator: "协调器",
  output: "输出",
  override: "覆盖",
  parallel: "并行",
  passthrough: "透传",
  paste: "粘贴",
  path: "路径",
  per: "每",
  persistence: "持久化",
  persistent: "持久",
  personality: "人格",
  piper: "Piper",
  pii: "PII",
  plugin: "插件",
  policy: "策略",
  prefill: "预填",
  pre: "预",
  preview: "预览",
  private: "私有",
  processing: "处理",
  profile: "配置档",
  profiles: "配置档",
  progress: "进度",
  project: "项目",
  prompt: "提示词",
  protect: "保护",
  privacy: "隐私",
  provider: "提供方",
  providers: "提供方",
  prune: "清理",
  rate: "速率",
  ratio: "比率",
  read: "读取",
  reactions: "表情反应",
  reasoning: "推理",
  recent: "最近",
  record: "记录",
  recording: "录音",
  recovery: "恢复",
  ref: "参考",
  redact: "脱敏",
  region: "区域",
  refresh: "刷新",
  reload: "重载",
  remove: "移除",
  require: "需要",
  response: "响应",
  restart: "重启",
  retention: "保留",
  retries: "重试次数",
  resume: "恢复",
  resumed: "恢复后",
  role: "角色",
  rooms: "房间",
  rotate: "轮转",
  run: "运行",
  runtime: "运行时",
  same: "相同",
  sample: "采样",
  sandbox: "沙箱",
  score: "分数",
  search: "搜索",
  seconds: "秒",
  secrets: "密钥",
  security: "安全",
  server: "服务器",
  service: "服务",
  session: "会话",
  sessions: "会话",
  shared: "共享",
  shell: "Shell",
  shortcut: "快捷键",
  show: "显示",
  silence: "静音",
  simulat: "模拟",
  simulated: "模拟",
  singularity: "Singularity",
  size: "大小",
  skills: "技能",
  skip: "跳过",
  skin: "皮肤",
  slack: "Slack",
  slash: "斜杠命令",
  snapshots: "快照",
  source: "来源",
  spawn: "派生",
  specifier: "指定器",
  speech: "语音",
  stale: "过期",
  status: "状态",
  stop: "停止",
  strategy: "策略",
  stream: "流式",
  streaming: "流式输出",
  subagent: "子代理",
  subagents: "子代理",
  summary: "摘要",
  system: "系统",
  tab: "标签页",
  target: "目标",
  telegram: "Telegram",
  template: "模板",
  terminal: "终端",
  text: "文本",
  theme: "主题",
  thread: "线程",
  tick: "轮询",
  tier: "层级",
  threshold: "阈值",
  timeout: "超时",
  timestamps: "时间戳",
  title: "标题",
  token: "Token",
  tool: "工具",
  toolsets: "工具集",
  total: "总计",
  trace: "追踪",
  triage: "分诊",
  trust: "信任",
  ttl: "TTL",
  tts: "TTS",
  turns: "轮次",
  tui: "TUI",
  update: "更新",
  url: "URL",
  urls: "URL",
  use: "使用",
  user: "用户",
  values: "值",
  vacuum: "清理压缩",
  vars: "变量",
  verifier: "校验器",
  vercel: "Vercel",
  version: "版本",
  vision: "视觉",
  visual: "视觉",
  voice: "语音",
  volumes: "卷",
  warn: "警告",
  warning: "警告",
  warnings: "警告",
  wait: "等待",
  web: "Web",
  website: "网站",
  worker: "工作线程",
  workspace: "工作区",
  wrap: "换行包装",
  write: "写入",
  x: "X",
  xai: "xAI",
  yaml: "YAML",
};

const ZH_SELECT_OPTION_OVERRIDES: Record<string, Record<string, string>> = {
  "agent.service_tier": {
    "": "未设置",
    auto: "自动",
    default: "默认",
    flex: "弹性",
  },
  "approvals.mode": {
    ask: "询问",
    deny: "拒绝",
    yolo: "直接放行",
  },
  "context.engine": {
    default: "默认",
    custom: "自定义",
  },
  "dashboard.theme": {
    default: "默认",
    midnight: "午夜",
    ember: "余烬",
    mono: "单色",
    cyberpunk: "赛博朋克",
    rose: "玫瑰",
  },
  "delegation.reasoning_effort": {
    "": "未设置",
    low: "低",
    medium: "中",
    high: "高",
  },
  "display.busy_input_mode": {
    interrupt: "中断",
    queue: "排队",
    steer: "引导",
  },
  "display.resume_display": {
    minimal: "精简",
    full: "完整",
    off: "关闭",
  },
  "display.skin": {
    default: "默认",
    ares: "战神",
    mono: "单色",
    slate: "石板",
  },
  "human_delay.mode": {
    off: "关闭",
    typing: "打字",
    fixed: "固定",
  },
  "logging.level": {
    DEBUG: "调试",
    INFO: "信息",
    WARNING: "警告",
    ERROR: "错误",
  },
  "memory.provider": {
    builtin: "内置",
    honcho: "Honcho",
  },
  "stt.provider": {
    local: "本地",
    openai: "OpenAI",
  },
  "terminal.backend": {
    local: "本地",
    docker: "Docker",
    ssh: "SSH",
    modal: "Modal",
    daytona: "Daytona",
    vercel_sandbox: "Vercel 沙箱",
    singularity: "Singularity",
  },
  "terminal.modal_mode": {
    sandbox: "沙箱",
    function: "函数",
  },
  "terminal.vercel_runtime": {
    node24: "Node 24",
    node22: "Node 22",
    "python3.13": "Python 3.13",
  },
  "tts.provider": {
    edge: "Edge",
    elevenlabs: "ElevenLabs",
    openai: "OpenAI",
    neutts: "NeuTTS",
  },
};

function isZh(locale: string | undefined): boolean {
  return String(locale || "en")
    .toLowerCase()
    .startsWith("zh");
}

function toEnglishLabel(input: string): string {
  return input
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function localizePhrase(phrase: string, locale: string | undefined): string {
  if (!isZh(locale)) return phrase;
  const trimmed = phrase.trim();
  if (!trimmed) return trimmed;
  const exact = ZH_DESCRIPTION_OVERRIDES[trimmed];
  if (exact) return exact;

  return trimmed
    .split(/(\s+|[()/:,=+-])/)
    .map((part) => {
      if (!part) return part;
      if (/^\s+$/.test(part)) return "";
      if (/^[()/:,=+-]$/.test(part)) return part;
      const direct = ZH_TOKEN_OVERRIDES[part.toLowerCase()];
      if (direct) return direct;
      if (/^\d+$/.test(part)) return part;
      if (part.includes(".")) return part;
      return part;
    })
    .join("");
}

export function localizeConfigCategory(
  category: string,
  t: Translations,
  locale: string | undefined,
): string {
  const categories = t.config.categories as Record<string, string>;
  if (categories[category]) return categories[category];
  if (isZh(locale) && ZH_CATEGORY_OVERRIDES[category]) {
    return ZH_CATEGORY_OVERRIDES[category];
  }
  return toEnglishLabel(category);
}

export function localizeConfigFieldLabel(
  schemaKey: string,
  locale: string | undefined,
): string {
  const rawLabel = schemaKey.split(".").pop() ?? schemaKey;
  if (isZh(locale) && ZH_LABEL_OVERRIDES[rawLabel]) {
    return ZH_LABEL_OVERRIDES[rawLabel];
  }
  return isZh(locale)
    ? localizePhrase(rawLabel.replace(/_/g, " "), locale)
    : toEnglishLabel(rawLabel);
}

export function localizeConfigFieldDescription(
  schemaKey: string,
  schema: Record<string, unknown>,
  locale: string | undefined,
): string {
  const description = schema.description ? String(schema.description) : "";
  if (!description || !isZh(locale)) return description;
  if (ZH_DESCRIPTION_OVERRIDES[description]) {
    return ZH_DESCRIPTION_OVERRIDES[description];
  }
  if (description.includes("→")) {
    return description
      .split("→")
      .map((part) => localizePhrase(part.trim(), locale))
      .join(" → ");
  }
  return localizePhrase(description, locale);
}

export function localizeConfigSectionName(
  section: string,
  locale: string | undefined,
): string {
  return isZh(locale)
    ? localizePhrase(section.replace(/_/g, " "), locale)
    : section.replace(/_/g, " ");
}

export function localizeConfigListPlaceholder(
  locale: string | undefined,
): string {
  return isZh(locale) ? "多个值请用逗号分隔" : "comma-separated values";
}

export function localizeConfigNoneOption(locale: string | undefined): string {
  return isZh(locale) ? "（无）" : "(none)";
}

export function localizeConfigSelectOption(
  schemaKey: string,
  option: string,
  locale: string | undefined,
): string {
  if (!isZh(locale)) return option || "(none)";
  const exact = ZH_SELECT_OPTION_OVERRIDES[schemaKey]?.[option];
  if (exact) return exact;
  if (!option) return localizeConfigNoneOption(locale);
  return localizePhrase(option.replace(/_/g, " "), locale);
}

export function localizeConfigListItemLabel(
  index: number,
  locale: string | undefined,
): string {
  return isZh(locale) ? `条目 ${index + 1}` : `Item ${index + 1}`;
}

export function localizeConfigResetDescription(
  count: number,
  locale: string | undefined,
): string {
  return isZh(locale)
    ? `这会将 ${count} 个字段恢复为默认值。`
    : `This will reset ${count} field(s) to their default values.`;
}
