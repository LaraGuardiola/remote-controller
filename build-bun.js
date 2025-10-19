await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./",
  compile: {
    target: "bun-windows-x64",
    outfile: "remote-controller.exe",
    windows: {
      title: "Remote Controller",
      publisher: "LaraGuardiola",
      version: "1.0.0.0",
      description: "Remote controller",
      copyright: "© 2025 LaraGuardiola",
      // hideConsole: true, //useless
      icon: "./assets/icon.ico",
    },
  },
});
