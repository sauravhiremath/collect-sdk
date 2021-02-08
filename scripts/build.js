'use strict';

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const chalk = require('chalk');
const glob = require('glob');
const micromatch = require('micromatch');
const prettier = require('prettier');
const transformOptions = require('../babel.config');
const { getPackages, adjustToTerminalWidth, OK } = require('./buildUtils');

const SRC_DIR = 'lib';
const BUILD_DIR = 'build';
const JS_FILES_PATTERN = '**/*.js';
const TS_FILES_PATTERN = '**/*.ts';
const IGNORE_PATTERN = '**/__{tests,mocks}__/**';
const PACKAGES_DIR = path.resolve(__dirname, '../packages');

const prettierConfig = prettier.resolveConfig.sync(__filename);
prettierConfig.trailingComma = 'none';
prettierConfig.parser = 'babel';

function getPackageName(file) {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file, buildFolder) {
  const pkgName = getPackageName(file);
  const pkgSrcPath = path.resolve(PACKAGES_DIR, pkgName, SRC_DIR);
  const pkgBuildPath = path.resolve(PACKAGES_DIR, pkgName, buildFolder);
  const relativeToSrcPath = path.relative(pkgSrcPath, file);
  return path.resolve(pkgBuildPath, relativeToSrcPath).replace(/\.ts$/, '.js');
}

function buildNodePackage(p) {
  const srcDir = path.resolve(p, SRC_DIR);
  const pattern = path.resolve(srcDir, '**/*');
  const files = glob.sync(pattern, { nodir: true });

  process.stdout.write(adjustToTerminalWidth(`${path.basename(p)}\n`));

  files.forEach((file) => buildFile(file, true));

  process.stdout.write(`${OK}\n`);
}

function buildFile(file, silent) {
  const destPath = getBuildPath(file, BUILD_DIR);

  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    silent ||
      process.stdout.write(
        chalk.dim('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          ' (ignore)\n'
      );
    return;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  if (
    !micromatch.isMatch(file, JS_FILES_PATTERN) &&
    !micromatch.isMatch(file, TS_FILES_PATTERN)
  ) {
    fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    silent ||
      process.stdout.write(
        chalk.red('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.red(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath) +
          ' (copy)' +
          '\n'
      );
  } else {
    const transformed = babel.transformFileSync(file, {
      configFile: './babel.config',
    }).code;
    const prettyCode = prettier.format(transformed, prettierConfig);

    fs.writeFileSync(destPath, prettyCode);

    silent ||
      process.stdout.write(
        chalk.green('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.green(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath) +
          '\n'
      );
  }
}

const files = process.argv.slice(2);

if (files.length) {
  files.forEach((file) => buildFile(file));
} else {
  const packages = getPackages();
  process.stdout.write(chalk.inverse(' Building packages \n'));
  packages.forEach(buildNodePackage);
}
