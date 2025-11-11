// Document Editor Functionality
document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('editor');
    const docTitle = document.getElementById('docTitle');

    // Auto-save document title
    docTitle.addEventListener('input', function() {
        document.title = this.value + ' - Google Docs Style';
        saveToLocalStorage();
    });

    // Handle toolbar button clicks
    const toolbarButtons = document.querySelectorAll('.toolbar-button[data-command]');
    toolbarButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const command = this.getAttribute('data-command');
            executeCommand(command);
        });
    });

    // Font family selector
    const fontSelect = document.querySelector('.font-select');
    fontSelect.addEventListener('change', function() {
        document.execCommand('fontName', false, this.value);
        editor.focus();
    });

    // Font size selector
    const sizeSelect = document.querySelector('.size-select');
    sizeSelect.addEventListener('change', function() {
        document.execCommand('fontSize', false, '7');
        const fontElements = editor.querySelectorAll('font[size="7"]');
        fontElements.forEach(element => {
            element.removeAttribute('size');
            element.style.fontSize = this.value + 'pt';
        });
        editor.focus();
    });

    // Execute formatting commands
    function executeCommand(command, value = null) {
        editor.focus();
        document.execCommand(command, false, value);
        updateToolbarState();
    }

    // Update toolbar button states
    function updateToolbarState() {
        toolbarButtons.forEach(button => {
            const command = button.getAttribute('data-command');
            if (command === 'bold' || command === 'italic' || command === 'underline') {
                if (document.queryCommandState(command)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }

    // Update toolbar state on selection change
    editor.addEventListener('mouseup', updateToolbarState);
    editor.addEventListener('keyup', updateToolbarState);

    // Handle keyboard shortcuts
    editor.addEventListener('keydown', function(e) {
        // Ctrl+B for bold
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            executeCommand('bold');
        }
        // Ctrl+I for italic
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            executeCommand('italic');
        }
        // Ctrl+U for underline
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            executeCommand('underline');
        }
        // Ctrl+S for save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveToLocalStorage();
            showNotification('Document saved');
        }
        // Tab key handling
        if (e.key === 'Tab') {
            e.preventDefault();
            executeCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
    });

    // Auto-save functionality
    let saveTimeout;
    editor.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToLocalStorage();
        }, 2000);
    });

    // Save to localStorage
    function saveToLocalStorage() {
        const data = {
            title: docTitle.value,
            content: editor.innerHTML
        };
        localStorage.setItem('googleDocsStyleDocument', JSON.stringify(data));
    }

    // Load from localStorage
    function loadFromLocalStorage() {
        const saved = localStorage.getItem('googleDocsStyleDocument');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                docTitle.value = data.title || 'Untitled document';
                editor.innerHTML = data.content || '<p>Start typing your document here...</p>';
                document.title = docTitle.value + ' - Google Docs Style';
            } catch (e) {
                console.error('Error loading saved document:', e);
            }
        }
    }

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #323232;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            animation: slideUp 0.3s ease-in-out;
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease-in-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Add slide animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translate(-50%, 0);
            }
            to {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
        }
    `;
    document.head.appendChild(style);

    // Print functionality
    const printButton = document.querySelector('[title="Print"]');
    if (printButton) {
        printButton.addEventListener('click', function() {
            window.print();
        });
    }

    // Word count feature
    function getWordCount() {
        const text = editor.innerText.trim();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }

    // Character count
    function getCharCount() {
        return editor.innerText.length;
    }

    // Add status bar
    const statusBar = document.createElement('div');
    statusBar.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #fff;
        border-top: 1px solid #e8eaed;
        padding: 8px 16px;
        font-size: 12px;
        color: #5f6368;
        display: flex;
        justify-content: space-between;
        z-index: 98;
    `;

    const statsDiv = document.createElement('div');
    statsDiv.id = 'documentStats';
    statusBar.appendChild(statsDiv);

    const timestampDiv = document.createElement('div');
    timestampDiv.id = 'lastSaved';
    timestampDiv.textContent = 'All changes saved';
    statusBar.appendChild(timestampDiv);

    document.body.appendChild(statusBar);

    // Update stats
    function updateStats() {
        const stats = document.getElementById('documentStats');
        if (stats) {
            const wordCount = getWordCount();
            const charCount = getCharCount();
            stats.textContent = `${wordCount} words, ${charCount} characters`;
        }
    }

    editor.addEventListener('input', function() {
        updateStats();
        const timestamp = document.getElementById('lastSaved');
        if (timestamp) {
            timestamp.textContent = 'Saving...';
            setTimeout(() => {
                timestamp.textContent = 'All changes saved';
            }, 1000);
        }
    });

    // Initialize
    loadFromLocalStorage();
    updateStats();
    updateToolbarState();

    // Handle paste to clean up formatting
    editor.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    });

    // Placeholder handling
    editor.addEventListener('focus', function() {
        if (this.innerHTML === '<p>Start typing your document here...</p>') {
            this.innerHTML = '<p><br></p>';
        }
    });

    // Share button functionality
    const shareButton = document.querySelector('.share-button');
    if (shareButton) {
        shareButton.addEventListener('click', function() {
            showNotification('Share feature would open a dialog here');
        });
    }

    // Star icon toggle
    const starIcon = document.querySelector('.star-icon');
    let isStarred = false;
    if (starIcon) {
        starIcon.addEventListener('click', function() {
            isStarred = !isStarred;
            const path = this.querySelector('path');
            if (isStarred) {
                path.setAttribute('fill', '#F9AB00');
                showNotification('Added to starred');
            } else {
                path.setAttribute('fill', '#5F6368');
                showNotification('Removed from starred');
            }
        });
    }

    // Menu items functionality
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            showNotification(`${this.textContent} menu clicked`);
        });
    });

    // Focus editor on load
    editor.focus();
});
