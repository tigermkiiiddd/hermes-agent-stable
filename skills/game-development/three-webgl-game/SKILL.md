---
name: three-webgl-game
description: Build browser-game runtimes with Three.js.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [threejs, webgl, 3d, runtime, vite]
    category: game-development
    related_skills: [web-game-foundations, web-3d-asset-pipeline, game-ui-frontend, game-playtest]
---

# Three WebGL Game Skill

这个技能用于非 React 场景下的 Three.js 3D 运行时实现。它强调显式 render loop、资产加载链路和性能可诊断性，适合需要底层控制的浏览器 3D 项目。

## When to Use

- 用户明确要求 Three.js 或 plain TS/Vite 3D 项目
- 需要直接控制 scene/camera/renderer/game loop
- 任务重点在运行时代码而非纯资产优化

## Prerequisites

- TypeScript/Vite 工程可运行
- `three` 及常用 loader 依赖可安装
- 可用 `terminal` 启动与调试，`patch` 进行实现

## How to Run

1. 先搭建 simulation 与 render 双层架构。
2. 完成最小可玩循环与相机输入边界。
3. 接入 GLB 资产、物理与 UI 覆盖层。
4. 做性能与上下文恢复验证。

## Quick Reference

- 架构参考: `../references/three-webgl-architecture.md`
- 栈说明: `../references/threejs-stack.md`
- Vanilla starter: `../references/threejs-vanilla-starter.md`
- GLTF 加载: `../references/gltf-loading-starter.md`
- Rapier 接入: `../references/rapier-integration-starter.md`
- 性能排查: `../references/webgl-debugging-and-performance.md`

## Procedure

1. 分层
   - `simulation/`: 规则、AI、任务、可保存状态。
   - `render/`: scene graph、camera、materials、postprocess。
2. 资产与加载
   - 默认 GLB/glTF 2.0，统一 loader 管线。
   - 压缩策略由资产流水线提供，不在 runtime 临时补丁。
3. 输入与 UI
   - 输入动作统一映射，控制菜单态与相机态切换。
   - HUD/菜单优先 DOM，避免场景内复杂文本 UI。
4. 稳定性
   - 处理 resize、context lost/recover。
   - 监控 draw calls、纹理尺寸、后处理成本。

## Pitfalls

- 把玩法状态塞进 Mesh/Material，导致难保存难测试
- 相机和菜单输入状态互相打架
- 后处理堆叠过度，影响读性与帧率

## Verification

- 首个可玩场景可稳定启动并完成核心动作链路
- resize 与菜单切换不导致输入错乱
- 至少完成一次性能检查并记录瓶颈来源
