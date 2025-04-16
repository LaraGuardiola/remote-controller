import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io();
const trackpad = document.querySelector(".trackpad");


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
    const x = touch.clientX - trackpad.offsetLeft;
    const y = touch.clientY - trackpad.offsetTop;
    socket.emit("movement", {
        x,
        y
    });
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

const throttledMove = throttle(handleTouchMove, 24);

trackpad.addEventListener("touchmove", (e) => {
    e.preventDefault();
    throttledMove(e);
});

trackpad.addEventListener("touchstart", (e) => {
    e.preventDefault();
});

// window.addEventListener("resize", sendDimensions);
window.addEventListener("orientationchange", sendDimensions);
