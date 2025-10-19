let currentClickHandler: ((e: Event) => void) | null = null;
let currentOutsideClickHandler: (() => void) | null = null;
let isShowingRescan = false;

const cleanupHeaderListeners = () => {
  const headerElement = document.querySelector(".header h3") as HTMLElement;
  if (!headerElement) return;

  if (currentClickHandler) {
    headerElement.removeEventListener("click", currentClickHandler);
    currentClickHandler = null;
  }

  if (currentOutsideClickHandler) {
    document.removeEventListener("click", currentOutsideClickHandler);
    currentOutsideClickHandler = null;
  }

  headerElement.classList.remove("clickable-ip", "rescan-mode");
  headerElement.style.cursor = "default";
  isShowingRescan = false;
};

export const updateHeaderMessage = (
  message: string,
  animate: boolean = true
) => {
  const headerElement = document.querySelector(".header h3");
  if (!headerElement) return;

  if (animate) {
    headerElement.classList.add("slide-out-right");
    setTimeout(() => {
      headerElement.textContent = message;
      headerElement.classList.remove("slide-out-right");
      headerElement.classList.add("slide-in-left");
      setTimeout(() => {
        headerElement.classList.remove("slide-in-left");
      }, 600);
    }, 400);
  } else {
    headerElement.textContent = message;
  }
};

export const setHeaderScanning = () => {
  cleanupHeaderListeners();
  const headerElement = document.querySelector(".header h3");
  if (!headerElement) return;
  headerElement.innerHTML = 'Scanning local network<span class="dots"></span>';
};

export const setHeaderFound = (ip: string, onRescan?: () => void) => {
  cleanupHeaderListeners();
  updateHeaderMessage(`PC found at ${ip}`);

  setTimeout(() => {
    updateHeaderMessage(ip);
    setupRescanInteraction(ip, onRescan);
  }, 2000);
};

export const setHeader = (message: string, onRescan?: () => void) => {
  cleanupHeaderListeners();
  updateHeaderMessage(message);

  if (onRescan) {
    setTimeout(() => {
      setupRescanInteraction(message, onRescan);
    }, 1000);
  }
};

export const setHeaderError = (onRescan?: () => void) => {
  cleanupHeaderListeners();
  updateHeaderMessage("No server found");

  if (onRescan) {
    setTimeout(() => {
      setupRescanInteraction("No server found", onRescan);
    }, 1000);
  }
};

export const setHeaderDisconnected = (onRescan?: () => void) => {
  cleanupHeaderListeners();
  updateHeaderMessage("Disconnected from server");

  if (onRescan) {
    setTimeout(() => {
      setupRescanInteraction("Disconnected from server", onRescan);
    }, 1000);
  }
};

const setupRescanInteraction = (
  originalText: string,
  onRescan?: () => void
) => {
  if (!onRescan) return;

  const headerElement = document.querySelector(".header h3") as HTMLElement;
  if (!headerElement) return;

  cleanupHeaderListeners();

  headerElement.classList.add("clickable-ip");
  headerElement.style.cursor = "pointer";

  currentClickHandler = (e: Event) => {
    e.stopPropagation();

    if (!isShowingRescan) {
      headerElement.textContent = "Scan again";
      headerElement.classList.add("rescan-mode");
      isShowingRescan = true;
    } else {
      cleanupHeaderListeners();
      if (onRescan) {
        onRescan();
      }
    }
  };

  currentOutsideClickHandler = () => {
    if (isShowingRescan) {
      headerElement.textContent = originalText;
      headerElement.classList.remove("rescan-mode");
      isShowingRescan = false;
    }
  };

  headerElement.addEventListener("click", currentClickHandler);
  document.addEventListener("click", currentOutsideClickHandler);
};

export const cleanupHeader = () => {
  cleanupHeaderListeners();
};
