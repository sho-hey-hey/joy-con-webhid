const { argv } = require('process');
const { build } = require('esbuild');
const path = require('path');

const options = {
  define: { 'process.env.NODE_ENV': process.env.NODE_ENV },
  entryPoints: [path.resolve(__dirname, 'src/index.ts')],
  minify: argv[2] === 'production',
  bundle: true,
  target: 'es2016',
  format: 'esm',
  platform: 'browser',
  outdir: path.resolve(__dirname, 'lib'),
  tsconfig: path.resolve(__dirname, 'tsconfig.json'),
};

// Buildの実行
build(options).catch((err) => {
  console.log(err);
});
