
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import SFTPClient from 'ssh2-sftp-client';
import { config, log } from './common.mjs';
import { eslint } from './eslint.mjs';
import { TypeScriptOptions, typescript } from './typescript.mjs';
import { MyPackOptions, MyPackResult, mypack } from './mypack.mjs';

const getTypescriptOptions = (watch: boolean): TypeScriptOptions => ({
    base: 'normal',
    entry: 'src/server-core/index.ts',
    sourceMap: 'hide',
    watch,
});

const getMyPackOptions = (files: MyPackOptions['files']): MyPackOptions => ({
    type: 'app',
    files,
    entry: '/vbuild/server-core/index.js',
    sourceMap: true,
    output: 'index.js',
    printModules: true,
    minify: true,
});

interface Asset {
    data: Buffer,
    remote: string, // should be absolute
}
const getUploadAssets = (packResult: MyPackResult): Asset[] => [
    { remote: 'index.js', data: packResult.resultJs },
    { remote: 'index.js.map', data: packResult.resultMap! },
];

const sshconnect = {
    host: config.remote,
    username: config.sshUser,
    privateKey: fs.readFileSync(config.sshIdentity),
    passphrase: config.sshPassphrase,
};

async function upload(assets: Asset[], options?: { filenames?: boolean, additionalHeader?: string }): Promise<boolean> {
    const client = new SFTPClient();

    for (const asset of assets) {
        if (!asset.data || !Buffer.isBuffer(asset.data)) { // in case I missed mypack config
            log.error('ssh', `${path.basename(asset.remote)} invalid data`);
            return false;
        }
    }

    try {
        await client.connect(sshconnect);
        for (const asset of assets) {
            await client.put(asset.data, path.join(config.remoteDirectory, asset.remote), { writeStreamOptions: { mode: 0o644 } });
        }
        await client.end();
        log.info(`ssh${options?.additionalHeader ?? ''}`, chalk`upload {yellow ${assets.length}} files ${!options?.filenames ? assets.map(a => chalk.yellow(path.basename(a.remote))) : ''}`);
        return true;
    } catch (ex) {
        log.error(`ssh${options?.additionalHeader ?? ''}`, 'error ' + ex.message);
        return false;
    }
}

async function build(): Promise<void> {
    log.info('akr', chalk`{cyan server-core}`);
    await eslint('server-core', ['src/shared/**/*.ts', 'src/server-core/**/*.ts']);
    // mkdir(recursive) is not needed anymore
    // as I'm lazy to investigate ssh version, now it's assumed that server has already full deployed once and all folder already exists

    const checkResult = typescript(getTypescriptOptions(false)).check();
    if (!checkResult.success) {
        return log.critical('akr', chalk`{cyan server-core} failed at check`);
    }

    const packResult = await mypack(getMyPackOptions(checkResult.files)).run();
    if (!packResult.success) {
        return log.critical('akr', chalk`{cyan server-core} failed at pack`);
    }

    const uploadResult = await upload(getUploadAssets(packResult));
    if (!uploadResult) {
        return log.critical('akr', chalk`{cyan server-core} failed at upload`);
    }

    log.info('akr', chalk`{cyan server-core} completed successfully`);
}
await build();
