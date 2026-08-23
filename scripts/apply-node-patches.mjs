#!/usr/bin/env node
/**
 * Apply the repo-managed node_modules patches in patches/*.patch.json.
 *
 * npm has no built-in patched-dependencies support (that's pnpm/yarn), and
 * patch-package cannot find packages installed inside workspace members —
 * so patches are expressed as exact find/replace manifests and applied by
 * this script from the root postinstall.
 *
 * Contract:
 * - `find` must occur EXACTLY ONCE in the target file; anything else is a
 *   hard failure (exit 1) so a dependency version bump cannot silently
 *   drop a patch.
 * - If `replace` is already present the patch is reported as applied
 *   (idempotent re-runs).
 * - A package that is not installed anywhere is skipped quietly (not every
 *   environment installs every workspace's deps).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const patchesDir = join(root, 'patches')

if (!existsSync(patchesDir)) {
  process.exit(0)
}

// Where workspace installs may put packages, in resolution order.
const moduleDirCandidates = ['node_modules', 'apps/desktop/node_modules', 'web/node_modules', 'ui-tui/node_modules']

let failed = false

for (const entry of readdirSync(patchesDir).sort()) {
  if (!entry.endsWith('.patch.json')) {
    continue
  }

  const patch = JSON.parse(readFileSync(join(patchesDir, entry), 'utf8'))
  const relativeTarget = join(patch.package, patch.file)
  const target = moduleDirCandidates.map(dir => join(root, dir, relativeTarget)).find(existsSync)

  if (!target) {
    console.log(`[patches] ${patch.package}: not installed here — skipping`)
    continue
  }

  const source = readFileSync(target, 'utf8')

  if (source.includes(patch.replace)) {
    console.log(`[patches] ${patch.package}@${patch.version}: already applied`)
    continue
  }

  const occurrences = source.split(patch.find).length - 1

  if (occurrences === 0) {
    console.error(
      `[patches] ${entry}: target snippet not found in ${patch.package}/${patch.file} — the installed version differs from ${patch.version}. Re-derive the patch (or drop it if upstream fixed it).`
    )
    failed = true
    continue
  }

  if (occurrences > 1) {
    console.error(`[patches] ${entry}: target snippet occurs ${occurrences}x — refusing an ambiguous replace.`)
    failed = true
    continue
  }

  writeFileSync(target, source.replace(patch.find, patch.replace))
  console.log(`[patches] ${patch.package}@${patch.version}: applied ${patch.file}`)
}

if (failed) {
  process.exit(1)
}
