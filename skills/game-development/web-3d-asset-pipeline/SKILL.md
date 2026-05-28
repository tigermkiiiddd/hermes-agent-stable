---
name: web-3d-asset-pipeline
description: Prepare and optimize browser-game 3D assets.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [3d-assets, glb, gltf, lod, compression]
    category: game-development
    related_skills: [three-webgl-game, react-three-fiber-game, web-game-foundations]
---

# Web 3D Asset Pipeline Skill

这个技能用于浏览器 3D 资产的交付前处理与优化，不负责运行时架构。目标是把 DCC 输出变成稳定、可预测、可加载的 GLB/glTF 资产。

## When to Use

- 用户要做 GLB/glTF 导出、压缩、LOD、碰撞代理
- 运行时已确定，瓶颈在资产质量或体积
- 需要建立统一的 3D 资产交付规范

## Prerequisites

- 有可编辑的源资产与目标运行时信息
- 可用 `terminal` 执行转换与检查命令
- 已确认引擎加载链路（Three.js/R3F/Babylon/PlayCanvas）

## How to Run

1. 清理源资产并统一单位/朝向/枢轴。
2. 导出 GLB/glTF 并做压缩与去冗余。
3. 验证层级命名、材质复用、贴图预算与碰撞代理。
4. 在运行时做加载与视觉回归检查。

## Quick Reference

- 总体参考: `../references/web-3d-asset-pipeline.md`
- 引擎生态: `../references/threejs-stack.md`
- R3F 生态: `../references/react-three-fiber-stack.md`
- 备选引擎: `../references/alternative-3d-engines.md`

## Procedure

1. 资产规范化
   - 统一单位、朝向、pivot 与命名。
   - 修复重复材质与无用节点。
2. 导出与压缩
   - 默认导出 GLB 或 glTF 2.0。
   - 根据项目约束选择 Draco/Meshopt 与纹理压缩方案。
3. 运行时可用性
   - 检查碰撞代理、LOD 层级、烘焙光照假设是否一致。
   - 确认 loader 在目标设备下可稳定解码。
4. 预算复盘
   - 记录模型体积、贴图预算、首帧加载代价。

## Pitfalls

- 直接把 DCC 原始导出文件塞进生产
- 贴图分辨率远超实际显示需求
- 缺少碰撞代理，运行时用代码兜底修资产错误

## Verification

- 目标资产可在运行时无报错加载
- 体积与加载时间满足既定预算
- 命名与层级满足后续程序化访问需求
