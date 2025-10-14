import { exec } from "child_process";

const taskName = "RemoteController";
const scriptPath = "C:\\{repository_path}\\index.js";
const nodePath = process.execPath;

const command = `schtasks /create /tn "${taskName}" /tr "'${nodePath}' '${scriptPath}'" /sc onlogon /rl highest /f`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error("Error creating task:", error);
    return;
  }
  console.log("Task created successfully:", stdout);
  console.log("⚠️  Restart the PC for changes to take effect.");
});
