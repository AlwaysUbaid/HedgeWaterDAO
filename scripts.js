document.addEventListener('DOMContentLoaded', function() {
    // Update clock
    function updateClock() {
        const now = new Date();
        const timeDisplay = document.querySelector('.time');
        timeDisplay.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    setInterval(updateClock, 1000);
    updateClock();

    // Desktop Icons functionality
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    
    desktopIcons.forEach(icon => {
        // Double click handler
        icon.addEventListener('dblclick', () => {
            const windowType = icon.dataset.window;
            createWindow(windowType);
        });

        // Single click handler for selection
        icon.addEventListener('click', (e) => {
            desktopIcons.forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    // Window Management
    let windows = [];
    let activeWindow = null;
    let zIndex = 1000;

    function createWindow(type) {
        const windowContent = getWindowContent(type);
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.innerHTML = `
            <div class="window-header">
                <div class="title-bar">
                    <img src="/api/placeholder/16/16" alt="Icon" class="window-icon">
                    ${windowContent.title}
                    <div class="window-controls">
                        <button class="minimize">_</button>
                        <button class="maximize">□</button>
                        <button class="close">×</button>
                    </div>
                </div>
            </div>
            <div class="window-content">
                ${windowContent.content}
            </div>
        `;

        document.body.appendChild(windowElement);
        makeWindowDraggable(windowElement);
        setupWindowControls(windowElement);
        activateWindow(windowElement);
        windows.push(windowElement);

        // Position the new window with slight offset from existing windows
        windowElement.style.top = `${50 + (windows.length * 30)}px`;
        windowElement.style.left = `${50 + (windows.length * 30)}px`;
        windowElement.style.transform = 'none';
    }

    function getWindowContent(type) {
        switch(type) {
            case 'about':
                return {
                    title: 'About Hedgewater',
                    content: `
                        <div style="padding: 20px">
                            <h2>About Us</h2>
                            <p>Hedgewater Associates is a leading investment firm...</p>
                        </div>
                    `
                };
            case 'vision':
                return {
                    title: 'Our Vision',
                    content: `
                        <div style="padding: 20px">
                            <h2>Our Vision</h2>
                            <p>To become the world's most trusted investment partner...</p>
                        </div>
                    `
                };
            case 'portfolio':
                return {
                    title: 'Portfolio',
                    content: `
                        <div style="padding: 20px">
                            <h2>Our Portfolio</h2>
                            <p>Explore our diverse investment portfolio...</p>
                        </div>
                    `
                };
            case 'recycle':
                return {
                    title: 'Recycle Bin',
                    content: `
                        <div style="padding: 20px">
                            <h2>Recycle Bin</h2>
                            <p>The recycle bin is empty.</p>
                        </div>
                    `
                };
            default:
                return {
                    title: 'Window',
                    content: '<div style="padding: 20px">Content goes here...</div>'
                };
        }
    }

    function makeWindowDraggable(windowElement) {
        const header = windowElement.querySelector('.window-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.closest('.window-controls')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header || e.target.parentNode === header) {
                isDragging = true;
                activateWindow(windowElement);
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, windowElement);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }
    }

    function setupWindowControls(windowElement) {
        const minimizeBtn = windowElement.querySelector('.minimize');
        const maximizeBtn = windowElement.querySelector('.maximize');
        const closeBtn = windowElement.querySelector('.close');
        let isMaximized = false;
        let originalStyles = {};

        minimizeBtn.addEventListener('click', () => {
            windowElement.style.display = 'none';
        });

        maximizeBtn.addEventListener('click', () => {
            if (!isMaximized) {
                // Save original styles
                originalStyles = {
                    top: windowElement.style.top,
                    left: windowElement.style.left,
                    width: windowElement.style.width,
                    height: windowElement.style.height,
                    transform: windowElement.style.transform
                };

                // Maximize
                windowElement.style.top = '0';
                windowElement.style.left = '0';
                windowElement.style.width = '100%';
                windowElement.style.height = 'calc(100% - 40px)'; // Account for taskbar
                windowElement.style.transform = 'none';
            } else {
                // Restore original styles
                Object.assign(windowElement.style, originalStyles);
            }
            isMaximized = !isMaximized;
        });

        closeBtn.addEventListener('click', () => {
            windowElement.remove();
            windows = windows.filter(w => w !== windowElement);
        });
    }

    function activateWindow(windowElement) {
        if (activeWindow === windowElement) return;
        
        windows.forEach(w => {
            w.style.zIndex = '1000';
            w.classList.remove('active');
        });
        
        windowElement.style.zIndex = String(++zIndex);
        windowElement.classList.add('active');
        activeWindow = windowElement;
    }

    // Initial window setup
    if (document.querySelector('.window')) {
        const initialWindow = document.querySelector('.window');
        makeWindowDraggable(initialWindow);
        setupWindowControls(initialWindow);
        windows.push(initialWindow);
        activateWindow(initialWindow);
    }
});