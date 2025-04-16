import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io();
const trackpad = document.querySelector(".trackpad");

let startX = 0;
let startY = 0;

const sendDimensions = () => {
    socket.emit("dimensions", {
        width: trackpad.clientWidth,
        height: trackpad.clientHeight
    });
    // console.log("Dimensiones enviadas:", trackpad.clientWidth, trackpad.clientHeight);
}

socket.on("connect", () => {
    console.log(socket.id);
    sendDimensions();
});

const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const currentX = touch.clientX - trackpad.offsetLeft;
    const currentY = touch.clientY - trackpad.offsetTop;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    socket.emit("movement", { deltaX, deltaY });

    startX = currentX;
    startY = currentY;
}

const throttle = (callback, delay) => {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            callback(...args);
        }
    };
}

const throttledMove = throttle(handleTouchMove, 16);

trackpad.addEventListener("touchmove", (e) => {
    e.preventDefault();
    throttledMove(e);
});

trackpad.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startX = touch.clientX - trackpad.offsetLeft;
    startY = touch.clientY - trackpad.offsetTop;
});

// window.addEventListener("resize", sendDimensions);
window.addEventListener("orientationchange", sendDimensions);
