import fs from "node:fs";
import path from "node:path";

const IMAGE_SUBSYSTEM_WINDOWS_GUI = 2;
const PE_HEADER_OFFSET_LOCATION = 0x3c;
const SUBSYSTEM_OFFSET = 0x5c;

function modifyBinarySubsystem(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const fd = fs.openSync(filePath, "r+");
  const buffer = Buffer.alloc(4);

  // Read PE header offset from 0x3C
  fs.readSync(fd, buffer, 0, 4, PE_HEADER_OFFSET_LOCATION);
  const peHeaderOffset = buffer.readUInt32LE(0);

  // Seek to the subsystem field in the PE header
  const subsystemOffset = peHeaderOffset + SUBSYSTEM_OFFSET;
  const subsystemBuffer = Buffer.alloc(2);
  subsystemBuffer.writeUInt16LE(IMAGE_SUBSYSTEM_WINDOWS_GUI, 0);

  // Write the new subsystem value
  fs.writeSync(fd, subsystemBuffer, 0, 2, subsystemOffset);
  fs.closeSync(fd);

  console.log(
    `✅ Successfully modified ${path.basename(
      filePath
    )} to hide the console at startup.`
  );
}

// Usage
if (process.argv.length !== 3) {
  console.log("Usage: bun run hide-console.ts <path-to-binary>");
  console.log("Example: bun run hide-console.ts ./server.exe");
  process.exit(1);
}

const binaryPath = process.argv[2];
modifyBinarySubsystem(binaryPath);
