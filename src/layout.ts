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
  const headerElement = document.querySelector(".header h3");
  if (!headerElement) return;

  headerElement.innerHTML = 'Scanning local network<span class="dots"></span>';
};

export const setHeaderFound = (ip: string, onRescan?: () => void) => {
  updateHeaderMessage(`PC found at ${ip}`);

  setTimeout(() => {
    updateHeaderMessage(ip);
    setupRescanInteraction(ip, onRescan);
  }, 2000);
};

const setupRescanInteraction = (ip: string, onRescan?: () => void) => {
  const headerElement = document.querySelector(".header h3") as HTMLElement;
  if (!headerElement) return;

  headerElement.classList.add("clickable-ip");
  headerElement.style.cursor = "pointer";

  let isShowingRescan = false;

  const handleClick = (e: Event) => {
    e.stopPropagation();

    if (!isShowingRescan) {
      headerElement.textContent = "Scan again";
      headerElement.classList.add("rescan-mode");
      isShowingRescan = true;
    } else {
      headerElement.classList.remove("rescan-mode", "clickable-ip");
      headerElement.style.cursor = "default";
      headerElement.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleOutsideClick);

      if (onRescan) {
        onRescan();
      }
    }
  };

  const handleOutsideClick = () => {
    if (isShowingRescan) {
      headerElement.textContent = ip;
      headerElement.classList.remove("rescan-mode");
      isShowingRescan = false;
    }
  };

  headerElement.addEventListener("click", handleClick);
  document.addEventListener("click", handleOutsideClick);
};

export const setHeaderError = () => {
  updateHeaderMessage("No server found");
};
