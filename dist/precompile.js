"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.precompile = void 0;
const esbuild_1 = require("esbuild");
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const precompile = ({ outdir = 'test-dist', srcRoot = '.', pattern = '*.spec.ts?(x)', }) => {
    fs_1.default.rmSync(outdir, { recursive: true, force: true });
    (0, glob_1.glob)(`${srcRoot}/**/${pattern}`, (error, matches) => {
        console.log(matches);
        (0, esbuild_1.build)({
            bundle: false,
            write: true,
            watch: false,
            entryPoints: matches,
            outdir,
            format: 'cjs',
            plugins: [replaceDirName],
        });
    });
    const replaceDirName = {
        name: 'replaceDirName',
        setup(build) {
            build.onLoad({ filter: /spec.tsx?$/ }, async (args) => {
                const content = await fs_1.default.promises.readFile(args.path, 'utf8');
                const srcDir = path_1.default.parse(args.path).dir;
                return {
                    contents: "import path from 'path'\n;" +
                        content.replace(/__dirname/gm, `"${srcDir}"`),
                    loader: 'tsx',
                };
            });
        },
    };
};
exports.precompile = precompile;
