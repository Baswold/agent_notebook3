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

    // Heading selector
    const headingSelect = document.getElementById('headingSelect');
    if (headingSelect) {
        headingSelect.addEventListener('change', function() {
            const heading = this.value;
            if (heading) {
                document.execCommand('formatBlock', false, heading);
            } else {
                document.execCommand('formatBlock', false, 'p');
            }
            editor.focus();
        });
    }

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

    // Find and Replace functionality
    function showFindReplaceDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'findReplaceDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 1001;
            min-width: 450px;
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; font-size: 18px;">Find and Replace</h3>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-size: 14px;">Find:</label>
                <input type="text" id="findText" style="width: 100%; padding: 8px; border: 1px solid #dadce0; border-radius: 4px; font-family: Roboto, Arial, sans-serif;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-size: 14px;">Replace with:</label>
                <input type="text" id="replaceText" style="width: 100%; padding: 8px; border: 1px solid #dadce0; border-radius: 4px; font-family: Roboto, Arial, sans-serif;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: flex; align-items: center; font-size: 14px;">
                    <input type="checkbox" id="matchCase" style="margin-right: 8px;">
                    Match case
                </label>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button id="closeFindReplace" style="padding: 8px 16px; background: none; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Close</button>
                <button id="replaceBtn" style="padding: 8px 16px; background: #5f6368; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Replace</button>
                <button id="replaceAllBtn" style="padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Replace All</button>
            </div>
            <div id="findReplaceStatus" style="margin-top: 12px; font-size: 12px; color: #5f6368;"></div>
        `;

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);

        const findInput = document.getElementById('findText');
        const replaceInput = document.getElementById('replaceText');
        const matchCaseCheckbox = document.getElementById('matchCase');
        const statusDiv = document.getElementById('findReplaceStatus');

        findInput.focus();

        function performReplace(replaceAll = false) {
            const findText = findInput.value;
            const replaceText = replaceInput.value;
            const matchCase = matchCaseCheckbox.checked;

            if (!findText) {
                statusDiv.textContent = 'Please enter text to find';
                return;
            }

            const content = editor.innerHTML;
            const flags = matchCase ? 'g' : 'gi';
            const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

            const matches = content.match(regex);

            if (!matches) {
                statusDiv.textContent = 'No matches found';
                return;
            }

            if (replaceAll) {
                editor.innerHTML = content.replace(regex, replaceText);
                statusDiv.textContent = `Replaced ${matches.length} occurrence(s)`;
                showNotification(`Replaced ${matches.length} occurrence(s)`);
            } else {
                // Replace first occurrence
                editor.innerHTML = content.replace(regex, function(match) {
                    return replaceText;
                });
                statusDiv.textContent = 'Replaced 1 occurrence';
                showNotification('Replaced 1 occurrence');
            }
        }

        document.getElementById('replaceBtn').addEventListener('click', function() {
            performReplace(false);
        });

        document.getElementById('replaceAllBtn').addEventListener('click', function() {
            performReplace(true);
        });

        document.getElementById('closeFindReplace').addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });

        backdrop.addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });
    }

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
        // Ctrl+Z for undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('undo', false, null);
            updateToolbarState();
        }
        // Ctrl+Y or Ctrl+Shift+Z for redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            document.execCommand('redo', false, null);
            updateToolbarState();
        }
        // Ctrl+F for find and replace
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            showFindReplaceDialog();
        }
        // Ctrl+H for find and replace
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            showFindReplaceDialog();
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

    // Version history
    let versionHistory = JSON.parse(localStorage.getItem('documentVersionHistory')) || [];

    function saveVersion() {
        const version = {
            title: docTitle.value,
            content: editor.innerHTML,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        versionHistory.unshift(version);

        // Keep only last 20 versions
        if (versionHistory.length > 20) {
            versionHistory = versionHistory.slice(0, 20);
        }

        localStorage.setItem('documentVersionHistory', JSON.stringify(versionHistory));
    }

    function showVersionHistory() {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 1001;
            min-width: 500px;
            max-height: 600px;
            overflow-y: auto;
        `;

        let versionsHTML = '<h3 style="margin: 0 0 16px 0; font-size: 18px;">Version History</h3>';

        if (versionHistory.length === 0) {
            versionsHTML += '<p style="color: #5f6368; font-size: 14px;">No version history available yet.</p>';
        } else {
            versionsHTML += '<div style="margin-bottom: 16px;">';
            versionHistory.forEach((version, index) => {
                const date = new Date(version.timestamp);
                const timeStr = date.toLocaleString();
                versionsHTML += `
                    <div class="version-item" data-version-id="${version.id}" style="padding: 12px; border: 1px solid #dadce0; border-radius: 4px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;">
                        <div style="font-weight: 500; font-size: 14px;">${version.title || 'Untitled document'}</div>
                        <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">${timeStr}</div>
                        <div style="font-size: 11px; color: #80868b; margin-top: 2px;">Version ${versionHistory.length - index}</div>
                    </div>
                `;
            });
            versionsHTML += '</div>';
        }

        versionsHTML += `
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button id="clearHistory" style="padding: 8px 16px; background: #ea4335; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Clear History</button>
                <button id="closeHistory" style="padding: 8px 16px; background: none; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Close</button>
            </div>
        `;

        dialog.innerHTML = versionsHTML;

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);

        // Add hover effects to version items
        const versionItems = dialog.querySelectorAll('.version-item');
        versionItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.background = '#f1f3f4';
            });
            item.addEventListener('mouseleave', function() {
                this.style.background = 'white';
            });
            item.addEventListener('click', function() {
                const versionId = parseInt(this.getAttribute('data-version-id'));
                const version = versionHistory.find(v => v.id === versionId);

                if (version && confirm(`Restore this version from ${new Date(version.timestamp).toLocaleString()}?`)) {
                    docTitle.value = version.title;
                    editor.innerHTML = version.content;
                    document.title = version.title + ' - Google Docs Style';
                    saveToLocalStorage();
                    showNotification('Version restored');
                    backdrop.remove();
                    dialog.remove();
                }
            });
        });

        const clearButton = document.getElementById('clearHistory');
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                if (confirm('Are you sure you want to clear all version history? This cannot be undone.')) {
                    versionHistory = [];
                    localStorage.setItem('documentVersionHistory', JSON.stringify(versionHistory));
                    showNotification('Version history cleared');
                    backdrop.remove();
                    dialog.remove();
                }
            });
        }

        const closeButton = document.getElementById('closeHistory');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });
        }

        backdrop.addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });
    }

    // Save to localStorage
    function saveToLocalStorage() {
        const data = {
            title: docTitle.value,
            content: editor.innerHTML
        };
        localStorage.setItem('googleDocsStyleDocument', JSON.stringify(data));

        // Save version every time document is saved
        saveVersion();
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

    // Undo functionality
    const undoButton = document.querySelector('[title="Undo"]');
    if (undoButton) {
        undoButton.addEventListener('click', function() {
            document.execCommand('undo', false, null);
            updateToolbarState();
        });
    }

    // Redo functionality
    const redoButton = document.querySelector('[title="Redo"]');
    if (redoButton) {
        redoButton.addEventListener('click', function() {
            document.execCommand('redo', false, null);
            updateToolbarState();
        });
    }

    // Text color picker
    const textColorBtn = document.getElementById('textColorBtn');
    const textColorPicker = document.getElementById('textColorPicker');
    const textColorIndicator = document.getElementById('textColorIndicator');

    if (textColorBtn && textColorPicker) {
        textColorBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            textColorPicker.click();
        });

        textColorPicker.addEventListener('change', function() {
            document.execCommand('foreColor', false, this.value);
            if (textColorIndicator) {
                textColorIndicator.setAttribute('fill', this.value);
            }
            editor.focus();
        });
    }

    // Highlight color picker
    const highlightColorBtn = document.getElementById('highlightColorBtn');
    const highlightColorPicker = document.getElementById('highlightColorPicker');
    const highlightColorIndicator = document.getElementById('highlightColorIndicator');

    if (highlightColorBtn && highlightColorPicker) {
        highlightColorBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            highlightColorPicker.click();
        });

        highlightColorPicker.addEventListener('change', function() {
            document.execCommand('hiliteColor', false, this.value);
            if (highlightColorIndicator) {
                highlightColorIndicator.setAttribute('fill', this.value);
            }
            editor.focus();
        });
    }

    // Link insertion
    const linkButton = document.querySelector('[title="Insert link"]');
    if (linkButton) {
        linkButton.addEventListener('click', function() {
            const selection = window.getSelection();
            const selectedText = selection.toString();

            // Create dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                z-index: 1001;
                min-width: 400px;
            `;

            dialog.innerHTML = `
                <h3 style="margin: 0 0 16px 0; font-size: 18px;">Insert Link</h3>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 14px;">Text:</label>
                    <input type="text" id="linkText" value="${selectedText}" style="width: 100%; padding: 8px; border: 1px solid #dadce0; border-radius: 4px; font-family: Roboto, Arial, sans-serif;">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 14px;">URL:</label>
                    <input type="url" id="linkUrl" placeholder="https://example.com" style="width: 100%; padding: 8px; border: 1px solid #dadce0; border-radius: 4px; font-family: Roboto, Arial, sans-serif;">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button id="cancelLink" style="padding: 8px 16px; background: none; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Cancel</button>
                    <button id="insertLink" style="padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Insert</button>
                </div>
            `;

            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            `;

            document.body.appendChild(backdrop);
            document.body.appendChild(dialog);

            const linkUrlInput = document.getElementById('linkUrl');
            const linkTextInput = document.getElementById('linkText');
            linkUrlInput.focus();

            // Insert link
            document.getElementById('insertLink').addEventListener('click', function() {
                const url = linkUrlInput.value;
                const text = linkTextInput.value || url;

                if (url) {
                    editor.focus();
                    if (selectedText) {
                        document.execCommand('createLink', false, url);
                    } else {
                        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${text}</a>`);
                    }
                    backdrop.remove();
                    dialog.remove();
                }
            });

            // Cancel
            document.getElementById('cancelLink').addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });

            backdrop.addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });
        });
    }

    // Image insertion
    const imageButton = document.querySelector('[title="Insert image"]');
    if (imageButton) {
        // Create hidden file input
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
        document.body.appendChild(imageInput);

        imageButton.addEventListener('click', function() {
            imageInput.click();
        });

        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.display = 'block';
                    img.style.margin = '10px 0';

                    editor.focus();
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(img);

                        // Move cursor after image
                        range.setStartAfter(img);
                        range.setEndAfter(img);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        editor.appendChild(img);
                    }

                    showNotification('Image inserted');
                };
                reader.readAsDataURL(file);
            }
            // Reset input
            imageInput.value = '';
        });
    }

    // Table insertion
    const insertTableBtn = document.getElementById('insertTableBtn');
    if (insertTableBtn) {
        insertTableBtn.addEventListener('click', function() {
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                z-index: 1001;
                min-width: 350px;
            `;

            dialog.innerHTML = `
                <h3 style="margin: 0 0 16px 0; font-size: 18px;">Insert Table</h3>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 14px;">Rows:</label>
                    <input type="number" id="tableRows" min="1" max="20" value="3" style="width: 100%; padding: 8px; border: 1px solid #dadce0; border-radius: 4px; font-family: Roboto, Arial, sans-serif;">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 14px;">Columns:</label>
                    <input type="number" id="tableColumns" min="1" max="20" value="3" style="width: 100%; padding: 8px; border: 1px solid #dadce0; border-radius: 4px; font-family: Roboto, Arial, sans-serif;">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button id="cancelTable" style="padding: 8px 16px; background: none; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Cancel</button>
                    <button id="createTable" style="padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Insert</button>
                </div>
            `;

            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            `;

            document.body.appendChild(backdrop);
            document.body.appendChild(dialog);

            const rowsInput = document.getElementById('tableRows');
            const columnsInput = document.getElementById('tableColumns');
            rowsInput.focus();

            document.getElementById('createTable').addEventListener('click', function() {
                const rows = parseInt(rowsInput.value);
                const cols = parseInt(columnsInput.value);

                if (rows > 0 && cols > 0 && rows <= 20 && cols <= 20) {
                    let tableHTML = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #dadce0;">';

                    for (let i = 0; i < rows; i++) {
                        tableHTML += '<tr>';
                        for (let j = 0; j < cols; j++) {
                            if (i === 0) {
                                tableHTML += '<th style="border: 1px solid #dadce0; padding: 8px; background-color: #f1f3f4; text-align: left;">&nbsp;</th>';
                            } else {
                                tableHTML += '<td style="border: 1px solid #dadce0; padding: 8px;">&nbsp;</td>';
                            }
                        }
                        tableHTML += '</tr>';
                    }

                    tableHTML += '</table><p><br></p>';

                    editor.focus();
                    document.execCommand('insertHTML', false, tableHTML);
                    showNotification('Table inserted');
                }

                backdrop.remove();
                dialog.remove();
            });

            document.getElementById('cancelTable').addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });

            backdrop.addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });
        });
    }

    // Line spacing control
    const lineSpacingBtn = document.getElementById('lineSpacingBtn');
    if (lineSpacingBtn) {
        lineSpacingBtn.addEventListener('click', function() {
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                z-index: 1001;
                min-width: 300px;
            `;

            const currentLineHeight = window.getComputedStyle(editor).lineHeight;
            const currentValue = parseFloat(currentLineHeight) / parseFloat(window.getComputedStyle(editor).fontSize);

            dialog.innerHTML = `
                <h3 style="margin: 0 0 16px 0; font-size: 18px;">Line Spacing</h3>
                <div style="margin-bottom: 16px;">
                    <div style="margin-bottom: 8px;">
                        <label style="display: flex; align-items: center; padding: 8px; cursor: pointer; border-radius: 4px;" class="spacing-option" data-spacing="1">
                            <input type="radio" name="lineSpacing" value="1" style="margin-right: 8px;" ${currentValue <= 1.2 ? 'checked' : ''}>
                            <span style="font-size: 14px;">Single (1.0)</span>
                        </label>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="display: flex; align-items: center; padding: 8px; cursor: pointer; border-radius: 4px;" class="spacing-option" data-spacing="1.15">
                            <input type="radio" name="lineSpacing" value="1.15" style="margin-right: 8px;" ${currentValue > 1.2 && currentValue <= 1.3 ? 'checked' : ''}>
                            <span style="font-size: 14px;">1.15</span>
                        </label>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="display: flex; align-items: center; padding: 8px; cursor: pointer; border-radius: 4px;" class="spacing-option" data-spacing="1.5">
                            <input type="radio" name="lineSpacing" value="1.5" style="margin-right: 8px;" ${currentValue > 1.3 && currentValue <= 1.7 ? 'checked' : ''}>
                            <span style="font-size: 14px;">1.5</span>
                        </label>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="display: flex; align-items: center; padding: 8px; cursor: pointer; border-radius: 4px;" class="spacing-option" data-spacing="2">
                            <input type="radio" name="lineSpacing" value="2" style="margin-right: 8px;" ${currentValue > 1.7 ? 'checked' : ''}>
                            <span style="font-size: 14px;">Double (2.0)</span>
                        </label>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button id="cancelSpacing" style="padding: 8px 16px; background: none; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Cancel</button>
                    <button id="applySpacing" style="padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Apply</button>
                </div>
            `;

            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            `;

            document.body.appendChild(backdrop);
            document.body.appendChild(dialog);

            // Add hover effects
            const spacingOptions = dialog.querySelectorAll('.spacing-option');
            spacingOptions.forEach(option => {
                option.addEventListener('mouseenter', function() {
                    this.style.background = '#f1f3f4';
                });
                option.addEventListener('mouseleave', function() {
                    this.style.background = 'transparent';
                });
            });

            document.getElementById('applySpacing').addEventListener('click', function() {
                const selected = dialog.querySelector('input[name="lineSpacing"]:checked');
                if (selected) {
                    editor.style.lineHeight = selected.value;
                    showNotification(`Line spacing set to ${selected.value}`);
                }
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });

            document.getElementById('cancelSpacing').addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });

            backdrop.addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });
        });
    }

    // Comments system
    let comments = JSON.parse(localStorage.getItem('documentComments')) || [];

    const commentButton = document.querySelector('[title="Insert comment"]');
    if (commentButton) {
        commentButton.addEventListener('click', function() {
            const selection = window.getSelection();
            const selectedText = selection.toString();

            if (!selectedText) {
                showNotification('Please select text to add a comment');
                return;
            }

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                z-index: 1001;
                min-width: 400px;
            `;

            dialog.innerHTML = `
                <h3 style="margin: 0 0 16px 0; font-size: 18px;">Add Comment</h3>
                <div style="margin-bottom: 12px;">
                    <div style="padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 12px; font-size: 13px; color: #5f6368;">
                        "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"
                    </div>
                    <textarea id="commentText" placeholder="Add your comment..." style="width: 100%; min-height: 100px; padding: 8px; border: 1px solid #dadce0; border-radius: 4px; font-family: Roboto, Arial, sans-serif; resize: vertical;"></textarea>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button id="cancelComment" style="padding: 8px 16px; background: none; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Cancel</button>
                    <button id="addComment" style="padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Add Comment</button>
                </div>
            `;

            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            `;

            document.body.appendChild(backdrop);
            document.body.appendChild(dialog);

            const commentTextArea = document.getElementById('commentText');
            commentTextArea.focus();

            document.getElementById('addComment').addEventListener('click', function() {
                const commentText = commentTextArea.value.trim();

                if (commentText) {
                    const comment = {
                        id: Date.now(),
                        text: commentText,
                        selectedText: selectedText,
                        timestamp: new Date().toISOString()
                    };

                    comments.push(comment);
                    localStorage.setItem('documentComments', JSON.stringify(comments));

                    // Wrap selected text in a span with comment indicator
                    const range = selection.getRangeAt(0);
                    const span = document.createElement('span');
                    span.style.backgroundColor = '#fef7e0';
                    span.style.borderBottom = '2px solid #f9ab00';
                    span.style.cursor = 'pointer';
                    span.setAttribute('data-comment-id', comment.id);
                    span.title = `Comment: ${commentText}`;

                    range.surroundContents(span);

                    span.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showCommentPopup(comment.id);
                    });

                    showNotification('Comment added');
                }

                backdrop.remove();
                dialog.remove();
                editor.focus();
            });

            document.getElementById('cancelComment').addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });

            backdrop.addEventListener('click', function() {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            });
        });
    }

    function showCommentPopup(commentId) {
        const comment = comments.find(c => c.id === commentId);
        if (!comment) return;

        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 1001;
            min-width: 300px;
        `;

        const date = new Date(comment.timestamp);
        popup.innerHTML = `
            <div style="font-size: 12px; color: #5f6368; margin-bottom: 8px;">${date.toLocaleString()}</div>
            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px; font-size: 13px;">
                "${comment.selectedText.substring(0, 100)}${comment.selectedText.length > 100 ? '...' : ''}"
            </div>
            <div style="margin-bottom: 12px; font-size: 14px;">${comment.text}</div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button id="deleteComment" style="padding: 6px 12px; background: #ea4335; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif; font-size: 12px;">Delete</button>
                <button id="closeCommentPopup" style="padding: 6px 12px; background: #5f6368; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif; font-size: 12px;">Close</button>
            </div>
        `;

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.3);
            z-index: 1000;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(popup);

        document.getElementById('deleteComment').addEventListener('click', function() {
            const span = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (span) {
                const parent = span.parentNode;
                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }
                parent.removeChild(span);
            }

            comments = comments.filter(c => c.id !== commentId);
            localStorage.setItem('documentComments', JSON.stringify(comments));

            backdrop.remove();
            popup.remove();
            showNotification('Comment deleted');
        });

        document.getElementById('closeCommentPopup').addEventListener('click', function() {
            backdrop.remove();
            popup.remove();
        });

        backdrop.addEventListener('click', function() {
            backdrop.remove();
            popup.remove();
        });
    }

    // Indentation controls
    const indentBtn = document.getElementById('indentBtn');
    const outdentBtn = document.getElementById('outdentBtn');

    if (indentBtn) {
        indentBtn.addEventListener('click', function() {
            document.execCommand('indent', false, null);
            editor.focus();
        });
    }

    if (outdentBtn) {
        outdentBtn.addEventListener('click', function() {
            document.execCommand('outdent', false, null);
            editor.focus();
        });
    }

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

    // Paragraph count
    function getParagraphCount() {
        const paragraphs = editor.querySelectorAll('p');
        return Array.from(paragraphs).filter(p => p.innerText.trim().length > 0).length;
    }

    // Sentence count
    function getSentenceCount() {
        const text = editor.innerText.trim();
        const sentences = text.match(/[.!?]+/g);
        return sentences ? sentences.length : 0;
    }

    // Reading time estimate
    function getReadingTime() {
        const words = getWordCount();
        const minutes = Math.ceil(words / 200); // Average reading speed
        return minutes;
    }

    // Show detailed statistics dialog
    function showStatisticsDialog() {
        const words = getWordCount();
        const chars = getCharCount();
        const charsNoSpaces = editor.innerText.replace(/\s/g, '').length;
        const paragraphs = getParagraphCount();
        const sentences = getSentenceCount();
        const readingTime = getReadingTime();

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 1001;
            min-width: 350px;
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; font-size: 18px;">Document Statistics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div style="padding: 12px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-size: 24px; font-weight: 500; color: #1a73e8;">${words}</div>
                    <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Words</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-size: 24px; font-weight: 500; color: #1a73e8;">${chars}</div>
                    <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Characters</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-size: 24px; font-weight: 500; color: #1a73e8;">${charsNoSpaces}</div>
                    <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Characters (no spaces)</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-size: 24px; font-weight: 500; color: #1a73e8;">${paragraphs}</div>
                    <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Paragraphs</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-size: 24px; font-weight: 500; color: #1a73e8;">${sentences}</div>
                    <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Sentences</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-size: 24px; font-weight: 500; color: #1a73e8;">${readingTime} min</div>
                    <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Reading time</div>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button id="closeStats" style="padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Close</button>
            </div>
        `;

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);

        document.getElementById('closeStats').addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });

        backdrop.addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });
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
    statsDiv.style.cursor = 'pointer';
    statsDiv.title = 'Click for detailed statistics';
    statsDiv.addEventListener('click', showStatisticsDialog);
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

    // Export functionality
    function exportDocument(format) {
        const title = docTitle.value || 'Untitled document';
        const content = editor.innerHTML;

        if (format === 'html') {
            const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Roboto', Arial, sans-serif;
            line-height: 1.6;
            max-width: 816px;
            margin: 40px auto;
            padding: 20px;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

            const blob = new Blob([fullHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.html`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('Exported as HTML');
        } else if (format === 'text') {
            const text = editor.innerText;
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('Exported as plain text');
        } else if (format === 'pdf') {
            // For PDF, we'll use the browser's print to PDF functionality
            window.print();
            showNotification('Use Print dialog to save as PDF');
        }
    }

    function showExportDialog() {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 1001;
            min-width: 350px;
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; font-size: 18px;">Export Document</h3>
            <p style="margin-bottom: 16px; font-size: 14px; color: #5f6368;">Choose export format:</p>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                <button id="exportPDF" style="padding: 12px; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif; text-align: left; font-size: 14px; transition: background 0.2s;">
                    📄 PDF (Print to PDF)
                </button>
                <button id="exportHTML" style="padding: 12px; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif; text-align: left; font-size: 14px; transition: background 0.2s;">
                    🌐 HTML
                </button>
                <button id="exportText" style="padding: 12px; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif; text-align: left; font-size: 14px; transition: background 0.2s;">
                    📝 Plain Text
                </button>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button id="closeExport" style="padding: 8px 16px; background: none; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Close</button>
            </div>
        `;

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);

        // Add hover effects
        const exportButtons = dialog.querySelectorAll('button[id^="export"]');
        exportButtons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.background = '#e8eaed';
            });
            btn.addEventListener('mouseleave', function() {
                this.style.background = '#f8f9fa';
            });
        });

        document.getElementById('exportPDF').addEventListener('click', function() {
            exportDocument('pdf');
            backdrop.remove();
            dialog.remove();
        });

        document.getElementById('exportHTML').addEventListener('click', function() {
            exportDocument('html');
            backdrop.remove();
            dialog.remove();
        });

        document.getElementById('exportText').addEventListener('click', function() {
            exportDocument('text');
            backdrop.remove();
            dialog.remove();
        });

        document.getElementById('closeExport').addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });

        backdrop.addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });
    }

    // Menu items functionality
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const menuText = this.textContent;
            if (menuText === 'File') {
                showExportDialog();
            } else if (menuText === 'View') {
                showVersionHistory();
            } else {
                showNotification(`${menuText} menu clicked`);
            }
        });
    });

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');

            // Save preference
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');

            updateDarkModeIcon(isDarkMode);
            showNotification(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled');
        });
    }

    function updateDarkModeIcon(isDarkMode) {
        if (darkModeIcon) {
            const path = darkModeIcon.querySelector('path');
            if (isDarkMode) {
                // Sun icon for light mode
                path.setAttribute('d', 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z');
            } else {
                // Moon icon for dark mode
                path.setAttribute('d', 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z');
            }
        }
    }

    // Accessibility: Keyboard shortcuts help
    document.addEventListener('keydown', function(e) {
        // Ctrl+/ or Ctrl+? to show keyboard shortcuts
        if (e.ctrlKey && (e.key === '/' || e.key === '?')) {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });

    function showKeyboardShortcuts() {
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'shortcutsTitle');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 1001;
            min-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        dialog.innerHTML = `
            <h3 id="shortcutsTitle" style="margin: 0 0 16px 0; font-size: 18px;">Keyboard Shortcuts</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 16px; font-size: 14px;">
                <div><strong>Ctrl+B</strong></div><div>Bold</div>
                <div><strong>Ctrl+I</strong></div><div>Italic</div>
                <div><strong>Ctrl+U</strong></div><div>Underline</div>
                <div><strong>Ctrl+Z</strong></div><div>Undo</div>
                <div><strong>Ctrl+Y</strong></div><div>Redo</div>
                <div><strong>Ctrl+S</strong></div><div>Save</div>
                <div><strong>Ctrl+F</strong></div><div>Find and Replace</div>
                <div><strong>Ctrl+H</strong></div><div>Find and Replace</div>
                <div><strong>Ctrl+/</strong></div><div>Show this help</div>
                <div><strong>Tab</strong></div><div>Insert spaces</div>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button id="closeShortcuts" style="padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: Roboto, Arial, sans-serif;">Close</button>
            </div>
        `;

        const backdrop = document.createElement('div');
        backdrop.setAttribute('role', 'presentation');
        backdrop.setAttribute('aria-hidden', 'true');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);

        const closeBtn = document.getElementById('closeShortcuts');
        closeBtn.focus();

        closeBtn.addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });

        backdrop.addEventListener('click', function() {
            backdrop.remove();
            dialog.remove();
            editor.focus();
        });

        // Trap focus in dialog
        dialog.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                backdrop.remove();
                dialog.remove();
                editor.focus();
            }
        });
    }

    // Accessibility: Announce changes to screen readers
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    // Override showNotification to also announce to screen readers
    const originalShowNotification = showNotification;
    showNotification = function(message) {
        originalShowNotification.call(this, message);
        announceToScreenReader(message);
    };

    // Focus editor on load
    editor.focus();
});
