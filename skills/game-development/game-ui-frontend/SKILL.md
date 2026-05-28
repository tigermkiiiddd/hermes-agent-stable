---
name: game-ui-frontend
description: Design browser-game HUDs, menus, and overlays.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [game-ui, hud, menu, overlay, frontend]
    category: game-development
    related_skills: [web-game-foundations, react-three-fiber-game, three-webgl-game, game-playtest]
---

# Game UI Frontend Skill

这个技能用于浏览器游戏的 HUD、菜单与覆盖层设计。目标是“可玩优先”，保持主视野清晰，而不是做通用 SaaS 面板。

## When to Use

- 用户要求做 HUD、菜单、弹层、移动端适配
- 3D 场景需要 UI 与相机控制协同
- 需要规范信息层级和视觉语言

## Prerequisites

- 已明确游戏题材、视角和核心动词
- 可用 `read_file`、`search_files` 查现有 UI 结构
- 可用 `patch` 实现布局和样式

## How to Run

1. 先定视觉方向和信息层级。
2. 再做布局与交互态设计。
3. 最后用截图和可玩性检查反推优化。

## Quick Reference

- 持久 HUD 预算: 桌面常驻区域建议不超过约 20-25%
- 默认模式: playfield 在 canvas/WebGL，文本密集 UI 在 DOM
- 菜单态规则: 菜单打开时显式屏蔽相机/角色控制
- 提示词参考: `../references/frontend-prompts.md`
- 3D HUD 模式: `../references/three-hud-layout-patterns.md`

## Procedure

1. 视觉与信息优先级
   - 先定义关键状态信息，再定义次级面板。
   - 高频信息常驻，低频信息折叠到抽屉或暂停面板。
2. 布局与控件
   - 保持中心和下中区域尽量清爽，避免大面积遮挡。
   - 移动端优先收起次级区块，改为小芯片或上下文提示。
3. 状态与输入协同
   - 明确“战斗态/菜单态/暂停态”输入切换。
   - 3D 项目要单独处理 pointer-lock 与菜单交互切换。
4. 读性与动效
   - 通过背景层、边缘、对比度提升可读性。
   - 动效用于状态变化，不做全局持续扰动。

## Pitfalls

- 用仪表盘式布局覆盖整个游戏画面
- 把大量说明文本常驻在主视野
- 菜单打开时仍保留相机输入，导致误操作

## Verification

- 首屏在 3 秒内可进入可玩状态
- HUD 在桌面和移动端都不遮挡核心交互区域
- 菜单打开与关闭时输入状态切换正确
