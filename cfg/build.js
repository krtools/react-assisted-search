const fs = require('fs');
const {minify} = require('uglify-js');
const {bold, red, yellow} = require('chalk');
const path = require('path');
const del = require('del');
const child_process = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ES = path.join(ROOT, 'es');

const webpack = require('webpack');

(async () => {
  try {
    await cleanDirs();
    await webpackBuild();
    await minified();
    await tsBuild();
  } catch (e) {
    if (e) {
      console.error(e);
      process.exit(1);
    }
  }
})();

async function cleanDirs() {
  for (let p of [DIST, ES]) {
    console.log(`Cleaning ${p}...`);
    await del(`${p}/**/*`);
  }
}

/** Run Uglify on the webpack output to create *.min.js */
async function minified() {
  console.log('minifying react-assisted-search.js...');
  let src = path.join(DIST, 'react-assisted-search');
  let output = minify(fs.readFileSync(`${src}.js`).toString(), {});
  fs.writeFileSync(`${src}.min.js`, output.code);
}

/**
 * Run the webpack build, move and rename outputs as needed
 * @returns {Promise<any>}
 */
async function webpackBuild() {
  console.log('starting webpack build....');

  await new Promise((resolve, reject) => {
    /** @type webpack.Configuration */
    let config = require('./dist');

    webpack(config, (err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        reject();
      }

      const info = stats.toJson();
      if (stats.hasErrors()) {
        if (Array.isArray(info.errors)) {
          info.errors.forEach(e => console.error(bold(red(e))));
        } else {
          console.error(info.errors);
        }
        reject();
      }

      if (stats.hasWarnings()) {
        if (Array.isArray(info.warnings)) {
          info.warnings.forEach(e => console.error(bold(yellow(e))));
        } else {
          console.warn(info.warnings);
        }
      }
      resolve();
    });
  });

  await del(path.join(DIST, 'assisted-*.js'));
  await del(path.join(DIST, 'es'));
  await del(path.join(DIST, 'dist'));
}

/**
 * Run tsc, cleanup and move to proper location
 * @returns {Promise<void>}
 */
async function tsBuild() {
  console.log(`Running ts-build`);
  child_process.execSync('yarn run build-ts', {
    cwd: ROOT,
    stdio: 'inherit'
  });
}


