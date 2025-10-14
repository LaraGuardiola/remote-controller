import { exec } from "child_process";

const taskName = "RemoteController";
exec(`schtasks /delete /tn "${taskName}" /f`, (error, stdout) => {
  console.log(stdout);
});
