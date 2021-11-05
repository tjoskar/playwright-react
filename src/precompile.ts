import { build } from 'esbuild'
import { glob } from 'glob'
import path from 'path'
import fs from 'fs'

export const precompile = ({
  outdir = 'test-dist',
  srcRoot = '.',
  pattern = '*.spec.ts?(x)',
}) => {
  fs.rmSync(outdir, { recursive: true, force: true })

  glob(`${srcRoot}/**/${pattern}`, (error, matches) => {
    build({
      bundle: false,
      write: true,
      watch: false,
      entryPoints: matches,
      outdir,
      format: 'cjs',
      plugins: [replaceDirName],
    })
  })

  const replaceDirName = {
    name: 'replaceDirName',
    setup(build: any) {
      build.onLoad({ filter: /spec.tsx?$/ }, async (args: any) => {
        const content = await fs.promises.readFile(args.path, 'utf8')
        const srcDir = path.parse(args.path).dir
        return {
          contents:
            "import path from 'path'\n;" +
            content.replace(/__dirname/gm, `"${srcDir}"`),
          loader: 'tsx',
        }
      })
    },
  }
}
