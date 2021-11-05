"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const precompile_1 = require("./precompile");
const child_process_1 = require("child_process");
const args = yargs_1.default
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
    .alias('help', 'h').argv;
(0, precompile_1.precompile)({ outdir: args.dist, pattern: args.pattern, srcRoot: args.source });
(0, child_process_1.spawn)('npx', ['playwright', 'test', args.dist], { stdio: 'inherit' });
