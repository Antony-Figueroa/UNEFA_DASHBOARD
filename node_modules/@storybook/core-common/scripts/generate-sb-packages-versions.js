#!/usr/bin/env node

const { promisify } = require('util');
const { readJson, writeFile } = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');
const semver = require('semver');
const { default: dedent } = require('ts-dedent');

const rootDirectory = path.join(__dirname, '..', '..', '..');

const logger = console;

const getMonorepoPackages = async () => {
  const process = promisify(exec);
  const contents = await process('yarn workspaces list --json --no-private', {
    cwd: rootDirectory,
  });

  return JSON.parse(`[${contents.stdout.trim().split('\n').join(',')}]`).map((w) => w.location);
};

const run = async () => {
  let updatedVersion = process.argv[process.argv.length - 1];

  if (!semver.valid(updatedVersion)) {
    updatedVersion = (await readJson(path.join(rootDirectory, 'package.json'))).version;
  }

  const storybookPackages = await getMonorepoPackages();

  const packageToVersionMap = (
    await Promise.all(
      storybookPackages.map(async (location) => {
        const { name, version } = await readJson(
          path.join(rootDirectory, location, 'package.json')
        );

        return {
          name,
          version,
        };
      })
    )
  )
    .filter(({ name }) => /^(@storybook|sb$|storybook$)/.test(name))
    // As some previous steps are asynchronous order is not always the same so sort them to avoid that
    .sort((package1, package2) => package1.name.localeCompare(package2.name))
    .reduce((acc, { name }) => ({ ...acc, [name]: updatedVersion }), {});

  const versionsPath = path.join(__dirname, '..', 'src', 'versions.ts');

  await writeFile(
    versionsPath,
    dedent`
      // auto generated file, do not edit
      export default ${JSON.stringify(packageToVersionMap, null, 2)}
    `
  );

  logger.log(`Updating versions and formatting results at: ${versionsPath}`);

  const prettierBin = path.join(rootDirectory, '..', 'scripts', 'node_modules', '.bin', 'prettier');
  exec(`${prettierBin} --write ${versionsPath}`, {
    cwd: path.join(rootDirectory),
  });
};

run().catch((e) => {
  logger.error(e);
  process.exit(1);
});
