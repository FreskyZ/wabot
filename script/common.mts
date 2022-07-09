import fs from 'node:fs';
import chalk from 'chalk';
import dayjs from 'dayjs';

// the config file contain things that should not be tracked by version control, such as ssh files and connection strings,
// the tsc wrapper (./typescript.mjs) will replace related variables at compile (transpile) time, which makes runtime easier
//
// key name naming convention:
// the can-be-variable values are designed to be used as variable, e.g. mysql.createPool(MYSQL_CONNECTION_STRING)
// the cannot-be-variable values are designed to be used in string literal, e.g. { key: fs.readFileSync('SSL-KEY'), cert: fs.readFileSync('SSL-CERT') }
//
// items
// // ssh config
// - REMOTE-URL: remote url
// - REMOTE-DIR: remote workspace file path
// - SSH-USER: string
// - SSH-IDENTIFY: file path
// - SSH-PASSPHRASE: string
// // app config
// - ADMIN_ID: admin user qq number
// - GROUP_ID: qq group number, currently only one
// - MYSQL_CONNECTION_STRING: mysql.createPool parameter
class Config {
    private readonly values: Record<string, string>;
    public readonly items: { name: string, value: string }[];

    // these values are used inside script
    public get remote() { return this.values['REMOTE-URL']; }
    public get remoteDirectory() { return this.values['REMOTE-DIR']; }
    public get sshUser() { return this.values['SSH-USER'] };
    public get sshIdentity() { return this.values['SSH-IDENTITY']; }
    public get sshPassphrase() { return this.values['SSH-PASSPHRASE']; }
    public constructor() {
        this.values = JSON.parse(fs.readFileSync('akaric', 'utf-8'));
        this.items = Object.entries(this.values).map(([name, value]) => ({ name, value }));
    }
}
export const config = new Config();

// color schema:
// error: red
// target name: cyan
// watching (the long displayed long message): blue
export const log = {
    info: (header: string, message: string, error?: any): void => {
        if (error) {
            console.log(chalk`[{green ${dayjs().format('HH:mm:ss.SSS')}} {gray ${header}}] ${message}`, error);
        } else {
            console.log(chalk`[{green ${dayjs().format('HH:mm:ss.SSS')}} {gray ${header}}] ${message}`);
        }
    },
    error: (header: string, message: string, error?: any): void => {
        if (error) {
            console.log(chalk`[{green ${dayjs().format('HH:mm:ss.SSS')}} {red ${header}}] ${message}`, error);
        } else {
            console.log(chalk`[{green ${dayjs().format('HH:mm:ss.SSS')}} {red ${header}}] ${message}`);
        }
    },
    critical: (header: string, message: string): never => {
        console.log(chalk`[{green ${dayjs().format('HH:mm:ss.SSS')}} {red ${header}}] ${message}`);
        return process.exit(1);
    }
};
