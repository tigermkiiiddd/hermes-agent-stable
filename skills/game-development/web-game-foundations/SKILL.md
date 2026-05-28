---
name: web-game-foundations
description: Set browser-game architecture before implementation.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [architecture, game-loop, input, state, engine-selection]
    category: game-development
    related_skills: [game-studio, phaser-2d-game, three-webgl-game, react-three-fiber-game]
---

# Web Game Foundations Skill

这个技能用于浏览器游戏开发前的架构定盘。重点是先锁定状态归属、输入模型、资产策略和调试边界，再进入具体引擎实现。

## When to Use

- 用户还没定引擎或目录结构
- 需求是“先搭架构，再写实现”
- 多个专项技能要共用同一基础边界

## Prerequisites

- 已定义玩法核心循环和目标平台
- 可用 `read_file`、`search_files` 对齐现有代码约束
- 可用 `patch` 产出初始模块骨架

## How to Run

1. 先锁定 simulation/render/UI/input 四层边界。
2. 再做引擎选择与资产格式规范。
3. 最后产出实施清单并交给具体实现技能。

## Quick Reference

- 引擎决策表: `../references/engine-selection.md`
- Phaser 架构: `../references/phaser-architecture.md`
- Three 架构: `../references/three-webgl-architecture.md`
- R3F 栈: `../references/react-three-fiber-stack.md`
- 3D 资产规范: `../references/web-3d-asset-pipeline.md`

## Procedure

1. 状态边界
   - simulation 保存实体、规则、进度、可序列化状态。
   - render 只负责表现层对象和效果。
2. 输入边界
   - 定义统一动作词典，如 `move`、`confirm`、`pause`。
   - 物理输入到动作映射只在一处维护。
3. 资产边界
   - 通过 manifest key 引用资产，不让文件名成为 API。
   - 3D 默认 GLB/glTF 2.0 作为交付格式。
4. 可运维边界
   - 定义 save 数据最小集。
   - 定义 debug/perf 开关和观测点。
5. 引擎分流
   - 2D 默认 Phaser。
   - 3D 非 React 默认 Three.js。
   - React 宿主 3D 默认 R3F。

## Pitfalls

- 在场景回调里直接写业务规则
- 渲染对象作为真相源，导致存档与回放不可控
- 菜单态和相机态无输入隔离，交互冲突频发

## Verification

- 有明确的模块边界图或目录骨架
- 有明确的引擎与资产格式结论
- 有可执行的实施清单并指向下游技能
