import { exec } from "child_process";
import { systemCommands } from "./commands.js";
import os from "os";
import robot from "robotjs_addon";

const platform = os.platform();

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

// Simple helper for system commands that gets messages from config
export const executeCommand = (commandKey) => {
  const config = systemCommands[commandKey];
  if (config && config[platform]) {
    executeSystemCommand(config[platform])
      .then(() => console.log(config.successMessage))
      .catch((err) => console.error(`${config.errorMessage}:`, err));
  } else {
    console.log(`Command "${commandKey}" not supported on ${platform}`);
  }
};

// Simple helper for keyboard shortcuts
export const executeKeyboardShortcut = (
  commandKey,
  key,
  modifier = "control",
) => {
  const config = systemCommands[commandKey];
  if (config && config[platform]) {
    robot.keyTap(key, modifier);
    console.log(config.successMessage);
  } else {
    console.log(`${commandKey} not supported on ${platform}`);
  }
};

export const openRocketLeague = () => {
  const rocketLeagueProcessName = "RocketLeague.exe";
  const rocketLeagueAppId = "252950";
  const checkCommand = `tasklist /NH /FI "IMAGENAME eq ${rocketLeagueProcessName}"`;
  const launchCommand = `start steam://rungameid/${rocketLeagueAppId}`;

  console.log(
    `[UTILITIES] Checking if ${rocketLeagueProcessName} is running...`,
  );

  exec(checkCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(
        `[UTILITIES] Error al ejecutar tasklist para comprobar el proceso: ${error.message}`,
      );
      return;
    }

    if (
      stdout &&
      stdout.toLowerCase().includes(rocketLeagueProcessName.toLowerCase())
    ) {
      console.log(`[UTILITIES]${rocketLeagueProcessName} is already running.`);
    } else {
      console.log(
        `[UTILITIES] ${rocketLeagueProcessName} has not been launched. Launching via Steam...`,
      );

      exec(launchCommand, (launchError, launchStdout, launchStderr) => {
        if (launchError) {
          console.error(
            `[UTILITIES] Error executing launch command for Steam: ${launchError.message}`,
          );
          return;
        }
      });
    }
  });
};
