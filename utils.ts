import os from "os";
import robot from "@jitsi/robotjs";
import COMMANDS from "./commands.json";
import asciiArt from "./assets/ascii-text-art.txt";
import { appendFile } from "node:fs/promises";
import fs from "node:fs";

const platform = os.platform();

export const getIp = (): string => {
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

export const executeSystemCommand = async (
  commandArray: string[]
): Promise<string> => {
  const proc = Bun.spawn(commandArray, {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stderr = await new Response(proc.stderr).text();
  const stdout = await new Response(proc.stdout).text();

  if (proc.exitCode !== 0 && stderr) {
    throw new Error(stderr);
  }
  return stdout || stderr;
};

export const executeCommand = (commandKey: string): void => {
  const config = COMMANDS[commandKey];
  if (config && config[platform]) {
    executeSystemCommand(config[platform])
      .then((output: string) => {
        console.log(config.successMessage);
        if (output) console.log(output);
      })
      .catch((err: Error) => console.error(`${config.errorMessage}:`, err));
  } else {
    console.log(`Command "${commandKey}" not supported on ${platform}`);
  }
};

export const executeKeyboardShortcut = (
  commandKey: string,
  key: string
): void => {
  const config = COMMANDS[commandKey];
  if (config && config[platform]) {
    robot.keyTap(key);
    console.log(config.successMessage);
  } else {
    console.log(`${commandKey} not supported on ${platform}`);
  }
};

export const openRocketLeague = async (): Promise<void> => {
  const rocketLeagueProcessName = "RocketLeague.exe";
  console.log(`[UTILITIES] Checking if RocketLeague.exe is running...`);
  try {
    const stdout = await executeSystemCommand(
      COMMANDS.rocketLeague.win32.checkCommand
    );
    if (
      stdout &&
      stdout.toLowerCase().includes(rocketLeagueProcessName.toLowerCase())
    ) {
      console.log(`[UTILITIES]${rocketLeagueProcessName} is already running.`);
    } else {
      console.log(
        `[UTILITIES] ${rocketLeagueProcessName} has not been launched. Launching via Steam...`
      );
      try {
        await executeSystemCommand(COMMANDS.rocketLeague.win32.launchCommand);
      } catch (launchError) {
        const error = launchError as Error;
        console.error(
          `[UTILITIES] Error executing launch command for Steam: ${error.message}`
        );
      }
    }
  } catch (error) {
    const err = error as Error;
    console.error(
      `[UTILITIES] Error checking tasklist for process: ${err.message}`
    );
  }
};

export const displayRemoteControllerAscii = (): void => {
  setTimeout(async () => {
    console.log(asciiArt + "\n");
  }, 500);
};

export const log = async (msg: string) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    if (!fs.existsSync("./logs")) fs.mkdirSync("./logs");
    await appendFile("./logs/event.log", line, "utf8");
  } catch {}
};
