import { exec } from 'child_process';

export const executeSystemCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error}`);
                reject(error);
                return;
            }
            resolve(stdout || stderr);
        });
    });
};