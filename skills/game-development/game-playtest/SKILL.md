---
name: game-playtest
description: Run browser-game playtests and frontend QA.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [game, playtest, qa, browser, frontend]
    category: game-development
    related_skills: [web-game-foundations, game-ui-frontend]
---

# Game Playtest Skill

这个技能用于浏览器游戏验收与缺陷定位，重点是玩家可见行为而不是只看代码。它覆盖启动流程、输入响应、HUD 可读性、场景切换和跨分辨率表现。

## When to Use

- 用户要求做浏览器游戏 smoke test 或回归验证
- 需要截图证据来确认 canvas/WebGL 渲染状态
- 需要按严重级别输出问题清单与复现步骤

## Prerequisites

- 项目可本地启动，且有明确访问地址
- 可用 `browser_navigate`、`browser_snapshot`、`vision_analyze` 或等效浏览器能力
- 如果需要改代码修复，使用 `read_file`、`search_files`、`patch`

## How to Run

1. 启动项目并记录入口 URL。
2. 用浏览器自动化或手动流程跑一遍核心玩法。
3. 在关键状态截图并标注问题位置。
4. 按严重级别输出发现项和建议归属模块。

## Quick Reference

- 启动验证: 首屏是否可交互，是否出现阻塞弹层
- 输入验证: 键鼠/触控/暂停/恢复是否一致
- UI 验证: HUD 是否遮挡主视野，信息层级是否清晰
- 渲染验证: 纹理、材质、相机、缩放、丢帧、闪烁
- 参考清单: `../references/playtest-checklist.md`
- 3D 性能排查: `../references/webgl-debugging-and-performance.md`

## Procedure

1. 启动与首屏
   - 确认加载完成后 3 秒内有明确可执行动作。
   - 记录首屏布局是否过度 UI 化而影响可玩性。
2. 核心动词
   - 至少覆盖移动、交互、战斗或主要动作链路。
   - 检查输入反馈和游戏状态反馈是否同步。
3. HUD 与菜单
   - 检查常驻 HUD 的覆盖面积和可读性。
   - 检查菜单打开时是否正确屏蔽相机/角色控制。
4. 视口与设备
   - 至少验证桌面与移动两种视口。
   - 检查安全区、刘海区、横竖屏切换。
5. 问题报告
   - 每条问题都写明现象、复现步骤、影响、疑似归属。
   - 输出顺序按 `critical -> high -> medium -> low`。

## Pitfalls

- 只做 DOM 断言，不做截图比对，容易漏掉渲染回归
- 把“看起来怪”当结论，不给可复现步骤
- 忽略输入状态机，导致菜单态与控制态冲突漏检

## Verification

- 至少产出 3 张关键状态截图（首屏、主玩法、菜单态）
- 至少覆盖 1 次窗口 resize 或移动端视口
- 报告中每个问题都有复现步骤和影响说明
