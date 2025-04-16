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
let longPressTimer = null;
const longPressDuration = 500;
let isDragging = false;
let isTwoFingerGesture = false;

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
        isTwoFingerGesture = true;
        
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

        if (twoFingerTouchStart && e.touches.length === 2) {
            const deltaX1 = Math.abs(e.touches[0].clientX - trackpad.offsetLeft - startX[0]);
            const deltaY1 = Math.abs(e.touches[0].clientY - trackpad.offsetTop - startY[0]);
            const deltaX2 = Math.abs(e.touches[1].clientX - trackpad.offsetLeft - startX[1]);
            const deltaY2 = Math.abs(e.touches[1].clientY - trackpad.offsetTop - startY[1]);

            if (deltaX1 > twoFingerMoveThreshold || deltaY1 > twoFingerMoveThreshold || 
                deltaX2 > twoFingerMoveThreshold || deltaY2 > twoFingerMoveThreshold) {
                moved = true;
            }
        }
        
        return;
    }

    if (isTwoFingerGesture && e.touches.length === 1) {
        isTwoFingerGesture = false;
        startX[0] = e.touches[0].clientX - trackpad.offsetLeft;
        startY[0] = e.touches[0].clientY - trackpad.offsetTop;
        return;
    }

    const touch = e.touches[0];
    const currentX = touch.clientX - trackpad.offsetLeft;
    const currentY = touch.clientY - trackpad.offsetTop;

    const deltaX = currentX - startX[0];
    const deltaY = currentY - startY[0];

    if (Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) {
        moved = true;
        
        if (!isDragging && longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        clickPossible = false;
    }

    // Enviar evento apropiado según el estado actual
    if (isDragging) {
        socket.emit("drag", deltaX, deltaY);
    } else {
        socket.emit("movement", deltaX, deltaY);
    }

    startX[0] = currentX;
    startY[0] = currentY;
}

const handleTouchClick = (e) => {
    socket.emit("click", "left");
}

const handleTwoFingerTouchEnd = (e) => {
    if (twoFingerTouchStart && e.touches.length === 0 && !moved) {
        socket.emit("click", "right");
    }
    twoFingerTouchStart = false;
    isTwoFingerGesture = false;
};

const startDragMode = () => {
    isDragging = true;
    socket.emit("dragStart");
}

const endDragMode = () => {
    if (isDragging) {
        socket.emit("dragEnd");
        isDragging = false;
    }
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
    startX = [];
    startY = [];
    moved = false;
    clickPossible = false;

    for (let i = 0; i < e.touches.length; i++) {
        startX.push(e.touches[i].clientX - trackpad.offsetLeft);
        startY.push(e.touches[i].clientY - trackpad.offsetTop);
    }

    if (e.touches.length === 2) {
        twoFingerTouchStart = true;
        isTwoFingerGesture = true;
        
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    } else if (e.touches.length === 1) {
        setTimeout(() => {
            clickPossible = true;
        }, clickDelay);
        
        if (!isTwoFingerGesture) {
            longPressTimer = setTimeout(() => {
                if (!moved) {
                    startDragMode();
                }
                longPressTimer = null;
            }, longPressDuration);
        }
    }
});

trackpad.addEventListener("touchend", (e) => {
    e.preventDefault();
    
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    
    if (!moved && clickPossible && e.touches.length === 0 && !isTwoFingerGesture) {
        handleTouchClick(e);
    }
    
    if (twoFingerTouchStart && e.touches.length === 0) {
        handleTwoFingerTouchEnd(e);
    }
    
    if (e.touches.length === 0) {
        endDragMode();
        isTwoFingerGesture = false;
    }
    
    moved = false;
});

window.addEventListener("orientationchange", sendDimensions);