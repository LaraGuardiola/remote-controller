import { io, Socket } from "socket.io-client";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { setHeaderError, setHeaderFound, setHeaderScanning } from "./layout";

let socket: Socket | null = null;
let ip: string | null = null;
let localAddress: string | null = null;

const scanNetwork = async (): Promise<string | null> => {
  const subnetsToScan = ["192.168.1.", "192.168.0."];

  for (const baseSubnet of subnetsToScan) {
    console.log(`Scanning network: ${baseSubnet}x`);

    const batchSize = 10;
    const requestTimeout = 800;
    const isNative = Capacitor.isNativePlatform();

    for (let start = 1; start <= 254; start += batchSize) {
      const batch: Promise<number | null>[] = [];
      const end = Math.min(start + batchSize - 1, 254);

      for (let ipNum = start; ipNum <= end; ipNum++) {
        const url = `http://${baseSubnet}${ipNum}:5173/health`;

        if (isNative) {
          const promise = CapacitorHttp.request({
            method: "GET",
            url,
            connectTimeout: requestTimeout,
            readTimeout: requestTimeout,
          })
            .then((response) => (response.status === 200 ? ipNum : null))
            .catch(() => null);

          batch.push(promise);
        } else {
          const promise = fetch(url, {
            signal: AbortSignal.timeout(requestTimeout),
          })
            .then(() => ipNum)
            .catch(() => null);

          batch.push(promise);
        }
      }

      let foundIp: number | null = null;

      if (isNative) {
        const results = await Promise.all(batch);
        foundIp = results.find((ip) => ip !== null) ?? null;
      } else {
        const results = await Promise.allSettled(batch);
        const fulfilled = results.find(
          (r): r is PromiseFulfilledResult<number> =>
            r.status === "fulfilled" && r.value !== null
        );
        foundIp = fulfilled?.value ?? null;
      }

      if (foundIp) {
        const fullIp = `${baseSubnet}${foundIp}`;
        console.log(
          `¡Server found at IP: ${fullIp} (Platform: ${
            isNative ? "Native" : "Web"
          })!`
        );
        return fullIp;
      }

      await new Promise((resolve) => setTimeout(resolve, isNative ? 50 : 100));
    }

    console.log(
      `Subnet ${baseSubnet} scan finished, moving to the next one...`
    );
  }

  console.log("Scan finished, server not found.");
  return null;
};

const handleRescan = async () => {
  console.log("Rescanning network...");

  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
  ip = null;
  localAddress = null;

  // Reset connection for rescanning
  const newSocket = await initConnection();

  if (newSocket) {
    window.dispatchEvent(
      new CustomEvent("socket-reconnected", {
        detail: { socket: newSocket },
      })
    );
  }
};

export const initConnection = async (): Promise<Socket | null> => {
  setHeaderScanning();

  ip = await scanNetwork();

  if (!ip) {
    setHeaderError();
    return null;
  }

  localAddress = `http://${ip}:5173`;

  setHeaderFound(ip, handleRescan);

  socket = io(localAddress, {
    transports: ["polling", "websocket"],
    timeout: 10000,
    forceNew: true,
    upgrade: true,
    rememberUpgrade: false,
  });

  return new Promise<Socket | null>((resolve) => {
    socket?.on("connect", async () => {
      console.log(socket?.id);

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

      resolve(socket as Socket);
    });

    socket?.on("disconnect", async () => {
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

    socket?.on("connect_error", (err: any) => {
      console.error("Socket initial connection error:", err);
      resolve(null);
    });

    setTimeout(() => {
      if (!socket?.connected) {
        console.log("Socket connection timeout reached.");
        resolve(null);
      }
    }, 12000);
  });
};

export const getSocket = () => socket;
export const getIp = () => ip;
