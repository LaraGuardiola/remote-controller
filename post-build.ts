import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const IMAGE_SUBSYSTEM_WINDOWS_GUI = 2;
const PE_HEADER_OFFSET_LOCATION = 0x3c;
const SUBSYSTEM_OFFSET = 0x5c;

function modifyBinarySubsystem(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`🔧 Modifying ${path.basename(filePath)}...`);

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

  console.log(`✅ ${path.basename(filePath)} modified successfully!`);
  console.log(`   → Console window will be hidden on launch`);
}

function createManifest(exePath: string): void {
  const manifestContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity
    version="1.0.0.0"
    processorArchitecture="*"
    name="RemoteTrackpadServer"
    type="win32"
  />
  <description>Remote Trackpad Server</description>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>`;

  const manifestPath = exePath + ".manifest";
  fs.writeFileSync(manifestPath, manifestContent, "utf8");
  console.log(`📄 Manifest created: ${path.basename(manifestPath)}`);
  return manifestPath;
}

function findMtExe(): string | null {
  // Common Windows SDK paths
  const possiblePaths = [
    "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\mt.exe",
    "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.19041.0\\x64\\mt.exe",
    "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.18362.0\\x64\\mt.exe",
  ];

  // Check if mt.exe is in PATH
  try {
    execSync("where mt.exe", { stdio: "pipe" });
    return "mt.exe";
  } catch {
    // Not in PATH, check common locations
  }

  // Check common Windows SDK locations
  for (const mtPath of possiblePaths) {
    if (fs.existsSync(mtPath)) {
      return mtPath;
    }
  }

  // Try to find any Windows SDK installation
  try {
    const windowsKitsBase = "C:\\Program Files (x86)\\Windows Kits\\10\\bin";
    if (fs.existsSync(windowsKitsBase)) {
      const versions = fs.readdirSync(windowsKitsBase);
      for (const version of versions) {
        const mtPath = path.join(windowsKitsBase, version, "x64", "mt.exe");
        if (fs.existsSync(mtPath)) {
          return mtPath;
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

function embedManifest(exePath: string, manifestPath: string): boolean {
  const mtExe = findMtExe();

  if (!mtExe) {
    console.log(`ℹ️  mt.exe not found - keeping external manifest file`);
    console.log(
      `   → Windows will read ${path.basename(manifestPath)} automatically`
    );
    console.log(`   → Distribute both .exe and .manifest files together`);
    return false;
  }

  try {
    console.log(`🔨 Embedding manifest using: ${mtExe}`);
    execSync(
      `"${mtExe}" -manifest "${manifestPath}" -outputresource:"${exePath}";1`,
      { stdio: "pipe" }
    );
    console.log(`✅ Manifest embedded successfully!`);
    console.log(`   → Application will request administrator privileges`);

    // Clean up manifest file
    fs.unlinkSync(manifestPath);
    console.log(`🧹 External manifest file removed (embedded in .exe)`);
    return true;
  } catch (error) {
    console.log(`⚠️  Could not embed manifest (keeping external file)`);
    console.log(
      `   → Windows will read ${path.basename(manifestPath)} automatically`
    );
    return false;
  }
}

// Get binary path from command line or use default
const binaryPath = process.argv[2] || "./server.exe";

console.log("🚀 Starting post-build processing...\n");

// Step 1: Hide console
modifyBinarySubsystem(binaryPath);

// Step 2: Add administrator privileges
console.log("");
const manifestPath = createManifest(binaryPath);
const embedded = embedManifest(binaryPath, manifestPath);

console.log("");
console.log("🎉 Build post-processing completed!");
if (embedded) {
  console.log("   ✅ Distribute only the .exe file");
} else {
  console.log("   ✅ Distribute both .exe and .manifest files together");
}
console.log("   ✅ Console hidden");
console.log("   ✅ Administrator privileges requested");
