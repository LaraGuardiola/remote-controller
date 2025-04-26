import { exec } from 'child_process';
import robot from 'robotjs';

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

export const simulateSpecialChar = (key) => {
    const asciiCode = key === 'ñ' ? 164 : 165;
    robot.keyToggle('alt', 'down');
    const textDigits = asciiCode.toString();
    for (let i = 0; i < textDigits.length; i++) {
        robot.keyTap(`numpad_${textDigits[i]}`);
    }
    robot.keyToggle('alt', 'up');
    console.log(`Key pressed: ${key}`);
}

export const openRocketLeague = () => {
    const rocketLeagueProcessName = 'RocketLeague.exe';
    const rocketLeagueAppId = '252950';
    const checkCommand = `tasklist /NH /FI "IMAGENAME eq ${rocketLeagueProcessName}"`;
    const launchCommand = `start steam://rungameid/${rocketLeagueAppId}`;

    console.log(`Checking if ${rocketLeagueProcessName} is running...`);

    exec(checkCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar tasklist para comprobar el proceso: ${error.message}`);
            return;
        }

        if (stdout && stdout.toLowerCase().includes(rocketLeagueProcessName.toLowerCase())) {
            console.log(`${rocketLeagueProcessName} is already running.`);
        } else {
            console.log(`${rocketLeagueProcessName} has not been launched. Launching via Steam...`);

            exec(launchCommand, (launchError, launchStdout, launchStderr) => {
                if (launchError) {
                    console.error(`Error executing launch command for Steam: ${launchError.message}`);
                    return;
                }
            });
        }
    });
}