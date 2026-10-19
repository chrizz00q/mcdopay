import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Writes dist/sw.js after the build, listing every built file so the whole app
 * is cached on first visit and works offline. The cache name changes whenever
 * any file changes, so a new deploy replaces the old cache.
 */
function offlineServiceWorker(): Plugin {
  let outDir = ''
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name)
      return statSync(full).isDirectory() ? walk(full) : [full]
    })

  return {
    name: 'mcdopay-offline-service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const files = walk(outDir)
        .map((f) => relative(outDir, f).split('\\').join('/'))
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map') && !f.endsWith('.woff')) // woff2 covers every modern browser
        .sort()
      const hash = createHash('sha1')
      files.forEach((f) => hash.update(f).update(readFileSync(join(outDir, f))))
      const version = hash.digest('hex').slice(0, 10)
      const template = readFileSync(fileURLToPath(new URL('./src/sw.template.js', import.meta.url)), 'utf8')
      const source = template
        .replaceAll('__VERSION__', version)
        .replaceAll('__FILES__', JSON.stringify(files))
      writeFileSync(join(outDir, 'sw.js'), source)
    },
  }
}

export default defineConfig({
  // Relative paths so the app works from any folder, such as
  // https://<user>.github.io/<repo>/ on GitHub Pages.
  base: './',
  plugins: [react(), offlineServiceWorker()],
  server: {
    allowedHosts: [
      'seeds-assembly-continued-teenage.trycloudflare.com',
      'generating-victoria-hitachi-tool.trycloudflare.com',
    ],
  },
})
