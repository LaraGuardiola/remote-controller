import { exec } from "child_process";
import os from "os";

export const getIp = () => {
  const interfaces = os.networkInterfaces();
  const network = interfaces["Wi-Fi"] || interfaces["Ethernet"];

  if (network) {
    for (const iface of network) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "No network found";
};

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

export const openRocketLeague = () => {
  const rocketLeagueProcessName = "RocketLeague.exe";
  const rocketLeagueAppId = "252950";
  const checkCommand = `tasklist /NH /FI "IMAGENAME eq ${rocketLeagueProcessName}"`;
  const launchCommand = `start steam://rungameid/${rocketLeagueAppId}`;

  console.log(`Checking if ${rocketLeagueProcessName} is running...`);

  exec(checkCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(
        `Error al ejecutar tasklist para comprobar el proceso: ${error.message}`,
      );
      return;
    }

    if (
      stdout &&
      stdout.toLowerCase().includes(rocketLeagueProcessName.toLowerCase())
    ) {
      console.log(`${rocketLeagueProcessName} is already running.`);
    } else {
      console.log(
        `${rocketLeagueProcessName} has not been launched. Launching via Steam...`,
      );

      exec(launchCommand, (launchError, launchStdout, launchStderr) => {
        if (launchError) {
          console.error(
            `Error executing launch command for Steam: ${launchError.message}`,
          );
          return;
        }
      });
    }
  });
};
