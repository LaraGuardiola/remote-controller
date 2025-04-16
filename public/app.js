import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io();
const trackpad = document.querySelector(".trackpad");

let startX = [];
let startY = [];
let moved = false;
const moveThreshold = 0.1;
let clickPossible = false;
const clickDelay = 50;
let twoFingerTouchStart = false;
const twoFingerMoveThreshold = 5;

const sendDimensions = () => {
    socket.emit("dimensions", {
        width: trackpad.clientWidth,
        height: trackpad.clientHeight
    });
}

socket.on("connect", () => {
    console.log(socket.id);
    sendDimensions();
});

const handleTouchMove = (e) => {
    if (e.touches.length > 1) {
        if (twoFingerTouchStart && e.touches.length === 2) {
            const deltaX1 = Math.abs(e.touches[0].clientX - trackpad.offsetLeft - startX[0]);
            const deltaY1 = Math.abs(e.touches[0].clientY - trackpad.offsetTop - startY[0]);
            const deltaX2 = Math.abs(e.touches[1].clientX - trackpad.offsetLeft - startX[1]);
            const deltaY2 = Math.abs(e.touches[1].clientY - trackpad.offsetTop - startY[1]);

            if (deltaX1 > twoFingerMoveThreshold || deltaY1 > twoFingerMoveThreshold || deltaX2 > twoFingerMoveThreshold || deltaY2 > twoFingerMoveThreshold) {
                twoFingerTouchStart = false;
            }
        }
        return;
    }

    const touch = e.touches[0];
    const currentX = touch.clientX - trackpad.offsetLeft;
    const currentY = touch.clientY - trackpad.offsetTop;

    const deltaX = currentX - startX[0];
    const deltaY = currentY - startY[0];

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
        moved = true;
        clickPossible = false;
    }

    socket.emit("movement", deltaX, deltaY);

    startX[0] = currentX;
    startY[0] = currentY;
}

const handleTouchClick = (e) => {
    socket.emit("click", "left");
}

const handleTwoFingerTouchEnd = (e) => {
    if (twoFingerTouchStart && e.touches.length === 0) {
        socket.emit("click", "right");
        twoFingerTouchStart = false;
    }
};

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
    startX = [];
    startY = [];
    moved = false;
    clickPossible = false;
    twoFingerTouchStart = false;

    for (let i = 0; i < e.touches.length; i++) {
        startX.push(e.touches[i].clientX - trackpad.offsetLeft);
        startY.push(e.touches[i].clientY - trackpad.offsetTop);
    }

    if (e.touches.length === 2) {
        twoFingerTouchStart = true;
    } else if (e.touches.length === 1) {
        setTimeout(() => {
            clickPossible = true;
        }, clickDelay);
    }
});

trackpad.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (!moved && clickPossible && e.touches.length === 0 && !twoFingerTouchStart) {
        handleTouchClick(e);
    }
    if (twoFingerTouchStart && e.touches.length === 0) {
        handleTwoFingerTouchEnd(e);
    }
    moved = false;
});

window.addEventListener("orientationchange", sendDimensions);