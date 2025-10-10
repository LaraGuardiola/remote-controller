import { io } from "socket.io-client";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

let socket = null;
let ip = null;
let localAddress = null;

// scan by batch, or you will DDOS yourself
const scanNetwork = async () => {
  const subnetsToScan = ["192.168.1.", "192.168.0."];

  for (const baseSubnet of subnetsToScan) {
    console.log(`Scanning network: ${baseSubnet}x`);

    const batchSize = 10;
    const requestTimeout = 800;
    const isNative = Capacitor.isNativePlatform();

    for (let start = 1; start <= 254; start += batchSize) {
      const batch = [];
      const end = Math.min(start + batchSize - 1, 254);

      for (let ipNum = start; ipNum <= end; ipNum++) {
        const url = `http://${baseSubnet}${ipNum}:3000/health`;

        if (isNative) {
          const promise = CapacitorHttp.request({
            method: "GET",
            url: url,
            connectTimeout: requestTimeout,
            readTimeout: requestTimeout,
          })
            .then((response) => (response.status === 200 ? ipNum : null))
            .catch(() => null);

          batch.push(promise);
        } else {
          const promise = fetch(url, {
            signal: AbortSignal.timeout(800),
          })
            .then(() => ipNum)
            .catch(() => null);

          batch.push(promise);
        }
      }

      let foundIp;

      if (isNative) {
        const results = await Promise.all(batch);
        foundIp = results.find((ip) => ip !== null);
      } else {
        const results = await Promise.allSettled(batch);
        foundIp = results.find(
          (r) => r.status === "fulfilled" && r.value !== null,
        )?.value;
      }

      if (foundIp) {
        const fullIp = `${baseSubnet}${foundIp}`;
        console.log(
          `¡Server found at IP: ${fullIp} (Platform: ${isNative ? "Native" : "Web"})!`,
        );

        return fullIp;
      }

      await new Promise((resolve) => setTimeout(resolve, isNative ? 50 : 100));
    }

    console.log(
      `Subnet ${baseSubnet} scan finished, moving to the next one...`,
    );
  }

  console.log("Scan finished, server not found.");
  return null;
};

export const initConnection = async () => {
  ip = (await scanNetwork()) || prompt("Enter your local IPv4:");
  localAddress = `http://${ip}:3000`;

  socket = io(localAddress, {
    transports: ["polling", "websocket"],
    timeout: 10000,
    forceNew: true,
    upgrade: true,
    rememberUpgrade: false,
  });

  return new Promise((resolve) => {
    socket.on("connect", async () => {
      console.log(socket.id);

      if (Capacitor.isNativePlatform()) {
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "Connection established",
                body: `Connected to ${localAddress}`,
                id: 1,
              },
            ],
          });
        } catch (error) {
          console.error("Error with notifications:", error);
        }
      }

      socket.emit("dimensions", {
        width: trackpad.clientWidth,
        height: trackpad.clientHeight,
      });

      resolve(socket);
    });

    // Manejador de DESCONEXIÓN (sin cambios)
    socket.on("disconnect", async () => {
      console.log("Disconnected from server");

      if (Capacitor.isNativePlatform()) {
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "Connection lost",
                body: `Disconnected from ${localAddress}`,
                id: 1,
              },
            ],
          });
        } catch (error) {
          console.error("Error with notifications:", error);
        }
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket initial connection error:", err);
      resolve(null);
    });

    setTimeout(() => {
      if (!socket.connected) {
        console.log("Socket connection timeout reached.");
        resolve(null);
      }
    }, 12000);
  });
};
