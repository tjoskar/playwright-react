import yargs from 'yargs'
import { precompile } from './precompile'
import { spawn } from 'child_process'

const args = yargs
  .option('source', {
    description: 'root dir in which to look for tests',
    alias: 's',
    default: '.',
    type: 'string',
  })
  .option('pattern', {
    description: 'glob pattern to match tests filenames',
    alias: 'p',
    default: '*.spec.ts?(x)',
    type: 'string',
  })
  .option('dist', {
    description: 'dir to output compiled test files',
    alias: 'd',
    default: 'test-dist',
    type: 'string',
  })
  .help()
  .alias('help', 'h').argv

precompile({ outdir: args.dist, pattern: args.pattern, srcRoot: args.source })
spawn('npx', ['playwright', 'test', args.dist], { stdio: 'inherit' })
