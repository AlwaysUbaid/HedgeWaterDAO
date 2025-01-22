document.addEventListener('DOMContentLoaded', function() {
    // Global state management
    const state = {
        windows: [],
        activeWindow: null,
        zIndex: 1000,
        isStartMenuOpen: false
    };

    // Clock functionality
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

    // Start Menu functionality
    function initializeStartMenu() {
        const startButton = document.querySelector('.start-button');
        const startMenu = document.querySelector('.start-menu');
        const startMenuItems = document.querySelectorAll('.start-menu-item');
        
        startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.classList.toggle('active');
            state.isStartMenuOpen = !state.isStartMenuOpen;
        });

        document.addEventListener('click', (e) => {
            if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
                startMenu.classList.remove('active');
                state.isStartMenuOpen = false;
            }
        });

        startMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                const windowType = item.dataset.window;
                createWindow(windowType);
                startMenu.classList.remove('active');
                state.isStartMenuOpen = false;
            });
        });
    }

    // Desktop Icons functionality
    function initializeDesktopIcons() {
        const desktopIcons = document.querySelectorAll('.desktop-icon');
        
        desktopIcons.forEach(icon => {
            icon.addEventListener('dblclick', () => {
                const windowType = icon.dataset.window;
                createWindow(windowType);
            });

            icon.addEventListener('click', () => {
                desktopIcons.forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            });
        });
    }

    // Window Management
// Update the createWindow function
function createWindow(type) {
    const windowContent = getWindowContent(type);
    const windowElement = document.createElement('div');
    windowElement.className = 'window';
    windowElement.style.display = 'flex';
    windowElement.style.flexDirection = 'column';
    windowElement.style.position = 'absolute';
    windowElement.style.transform = 'translate(-50%, -50%)';
    windowElement.style.width = '800px';  // Set a default width
    windowElement.style.height = '600px'; // Set a default height
    
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
    initializeWindow(windowElement);
    return windowElement;
}

function initializeWindow(windowElement) {
    makeWindowDraggable(windowElement);
    setupWindowControls(windowElement);
    state.windows.push(windowElement);
    
    // Calculate center position with offset based on number of windows
    const offset = state.windows.length * 30;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 40; // Subtract taskbar height
    
    // Position relative to center with offset
    windowElement.style.left = `${screenWidth/2 + offset}px`;
    windowElement.style.top = `${screenHeight/2 + offset}px`;
    
    activateWindow(windowElement);
}

    function makeWindowDraggable(windowElement) {
        const header = windowElement.querySelector('.window-header');
        const dragState = {
            isDragging: false,
            currentX: 0,
            currentY: 0,
            initialX: 0,
            initialY: 0
        };

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            
            dragState.isDragging = true;
            dragState.initialX = e.clientX - windowElement.offsetLeft;
            dragState.initialY = e.clientY - windowElement.offsetTop;
            
            activateWindow(windowElement);
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragState.isDragging) return;

            e.preventDefault();
            dragState.currentX = e.clientX - dragState.initialX;
            dragState.currentY = e.clientY - dragState.initialY;

            // Constrain to screen bounds
            const screenHeight = window.innerHeight - 40; // Subtract taskbar height
            dragState.currentX = Math.max(-windowElement.offsetWidth + 100, 
                Math.min(window.innerWidth - 100, dragState.currentX));
            dragState.currentY = Math.max(0, 
                Math.min(screenHeight - 30, dragState.currentY));

            windowElement.style.left = `${dragState.currentX}px`;
            windowElement.style.top = `${dragState.currentY}px`;
        });

        document.addEventListener('mouseup', () => {
            dragState.isDragging = false;
        });
    }

    function setupWindowControls(windowElement) {
        const controls = {
            minimize: windowElement.querySelector('.window-controls .minimize'),
            maximize: windowElement.querySelector('.window-controls .maximize'),
            close: windowElement.querySelector('.window-controls .close')
        };
    
        const taskbarButton = createTaskbarButton(windowElement);
        let isMaximized = false;
        let originalStyles = null;
    
        // Store initial position
        if (!windowElement.dataset.originalPosition) {
            originalStyles = {
                top: windowElement.style.top || '50%',
                left: windowElement.style.left || '50%',
                width: windowElement.style.width || '800px',
                height: windowElement.style.height || '600px',
                transform: windowElement.style.transform || 'translate(-50%, -50%)'
            };
            windowElement.dataset.originalPosition = JSON.stringify(originalStyles);
        }
    
        // Minimize
        controls.minimize.addEventListener('click', (e) => {
            e.stopPropagation();
            minimizeWindow(windowElement, taskbarButton);
        });
    
        // Maximize
        controls.maximize.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isMaximized) {
                // Store current position before maximizing
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
                windowElement.style.height = 'calc(100vh - 40px)';
                windowElement.style.transform = 'none';
            } else {
                // Restore
                Object.assign(windowElement.style, originalStyles);
            }
            isMaximized = !isMaximized;
        });
    
        // Close
        controls.close.addEventListener('click', (e) => {
            e.stopPropagation();
            windowElement.remove();
            taskbarButton.remove();
            state.windows = state.windows.filter(w => w !== windowElement);
            if (state.activeWindow === windowElement) {
                state.activeWindow = null;
            }
        });
    
        // Taskbar button
        taskbarButton.addEventListener('click', () => {
            if (windowElement.style.display === 'none') {
                windowElement.style.display = 'flex';
                activateWindow(windowElement);
                taskbarButton.classList.add('active');
            } else if (windowElement === state.activeWindow) {
                minimizeWindow(windowElement, taskbarButton);
            } else {
                activateWindow(windowElement);
            }
        });
    }

    function createTaskbarButton(windowElement) {
        const taskbarButtons = document.querySelector('.taskbar-buttons');
        const title = windowElement.querySelector('.title-bar').textContent.trim();
        
        const button = document.createElement('div');
        button.className = 'taskbar-button';
        button.innerHTML = `
            <img src="dash.png" alt="Window Icon">
            <span>${title}</span>
        `;

        taskbarButtons.appendChild(button);
        return button;
    }

    function toggleWindow(windowElement, taskbarButton) {
        const isMinimized = windowElement.style.display === 'none';
        
        if (isMinimized) {
            windowElement.style.display = 'flex';
            activateWindow(windowElement);
            taskbarButton.classList.add('active');
        } else if (windowElement === state.activeWindow) {
            minimizeWindow(windowElement, taskbarButton);
        } else {
            activateWindow(windowElement);
        }
    }

    function minimizeWindow(windowElement, taskbarButton) {
        windowElement.style.display = 'none';
        taskbarButton.classList.remove('active');
    }

    function createTaskbarButton(windowElement) {
        const taskbarButtons = document.querySelector('.taskbar-buttons');
        const title = windowElement.querySelector('.title-bar').textContent.trim();
        
        const button = document.createElement('div');
        button.className = 'taskbar-button';
        button.innerHTML = `
            <img src="dash.png" alt="Window Icon" class="icon-win">
            <span>${title}</span>
        `;
        
        button.classList.add('active'); // Add active class when created
        taskbarButtons.appendChild(button);
        return button;
    }

    function closeWindow(windowElement, taskbarButton) {
        windowElement.remove();
        taskbarButton.remove();
        state.windows = state.windows.filter(w => w !== windowElement);
    }

    function activateWindow(windowElement) {
        if (state.activeWindow === windowElement) return;
        
        state.windows.forEach(w => {
            w.style.zIndex = '1000';
            w.classList.remove('active');
            const btn = findTaskbarButton(w);
            if (btn) btn.classList.remove('active');
        });
        
        windowElement.style.zIndex = String(++state.zIndex);
        windowElement.classList.add('active');
        state.activeWindow = windowElement;
        
        const taskbarButton = findTaskbarButton(windowElement);
        if (taskbarButton) taskbarButton.classList.add('active');
    }

    function findTaskbarButton(windowElement) {
        const title = windowElement.querySelector('.title-bar').textContent.trim();
        return Array.from(document.querySelectorAll('.taskbar-button'))
            .find(btn => btn.textContent.trim() === title);
    }

    // Initialize everything
    initializeStartMenu();
    initializeDesktopIcons();

    // Initialize any existing windows
    if (document.querySelector('.window')) {
        const initialWindow = document.querySelector('.window');
        initializeWindow(initialWindow);
    }
});

// Window content templates
function getWindowContent(type) {
    const contents = {
        dashboard: {
            title: 'Hedgewater Fund Dashboard',
            content: `
                <div class="metrics-bar">
                    <div class="metric">
                        <span class="metric-label">Total AUM:</span>
                        <span class="metric-value">$125.7M</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Total Assets:</span>
                        <span class="metric-value">47</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">YTD ROI:</span>
                        <span class="metric-value positive">+18.5%</span>
                    </div>
                </div>
                <div class="content-grid">
                    <div class="grid-item funds-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fund Name</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>LTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Genesis I</td>
                                    <td class="negative">-1.35%</td>
                                    <td class="negative">-1.35%</td>
                                    <td class="positive">+7.29%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `
        },
        about: {
            title: 'About Hedgewater',
            content: `
                <div style="padding: 20px">
                    <h2>About Us</h2>
                    <p>Hedgewater Associates is a leading investment firm...</p>
                </div>
            `
        },
        vision: {
            title: 'Our Vision',
            content: `
                <div style="padding: 20px">
                    <h2>Our Vision</h2>
                    <p>To become the world's most trusted investment partner...</p>
                </div>
            `
        },
        portfolio: {
            title: 'Portfolio',
            content: `
                <div style="padding: 20px">
                    <h2>Our Portfolio</h2>
                    <p>Explore our diverse investment portfolio...</p>
                </div>
            `
        },
        recycle: {
            title: 'Recycle Bin',
            content: `
                <div style="padding: 20px">
                    <h2>Recycle Bin</h2>
                    <p>The recycle bin is empty.</p>
                </div>
            `
        }
    };

    return contents[type] || {
        title: 'Window',
        content: '<div style="padding: 20px">Content goes here...</div>'
    };
}