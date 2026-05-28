---
name: react-three-fiber-game
description: Build React-hosted 3D browser games with R3F.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [react, r3f, threejs, 3d, webgl]
    category: game-development
    related_skills: [web-game-foundations, game-ui-frontend, web-3d-asset-pipeline, game-playtest]
---

# React Three Fiber Game Skill

这个技能用于 React 宿主下的 3D 浏览器游戏实现。它强调 React UI 状态与 3D 场景状态的边界，而不是把所有高频逻辑都塞进 React 重渲染。

## When to Use

- 项目本身是 React 应用，3D 只是其中一部分
- 需要 R3F 的声明式场景组合能力
- 需要 3D 场景与应用 UI 状态共享

## Prerequisites

- React 项目基础可运行
- `three` 与 `@react-three/fiber` 可安装
- 可用 `terminal`、`read_file`、`patch` 做集成改造

## How to Run

1. 建立 Canvas 根组件和 DOM UI 根组件。
2. 把高频 simulation 与 React 状态解耦。
3. 用专用层处理相机、物理、后处理与输入态。

## Quick Reference

- 技术栈参考: `../references/react-three-fiber-stack.md`
- Starter 参考: `../references/react-three-fiber-starter.md`
- GLTF 加载: `../references/gltf-loading-starter.md`
- 物理接入: `../references/rapier-integration-starter.md`
- 3D HUD 样式: `../references/three-hud-layout-patterns.md`

## Procedure

1. 场景与状态边界
   - simulation 逻辑不直接依赖 React 组件生命周期。
   - React 管理 UI 与跨模块协调状态，高频循环局部化处理。
2. 组件分层
   - `SceneRoot` 负责 Canvas 与主场景挂载。
   - CameraRig/Controls/Physics 各自独立封装。
3. UI 协同
   - HUD、菜单、设置优先放在 DOM 层。
   - 菜单态显式关闭或门控相机输入。
4. 性能与可用性
   - 控制不必要 rerender，减少全局状态抖动。
   - 对后处理效果做开关，先保可玩再加特效。

## Pitfalls

- 让 React 组件变成玩法状态源，导致耦合和抖动
- 每帧都通过全局状态广播，性能急剧下降
- 在场景里硬塞复杂 HUD，难维护且可读性差

## Verification

- Canvas 与 DOM HUD 状态切换一致
- 菜单开启时相机输入被正确门控
- 关键场景帧率稳定，无明显交互卡顿
