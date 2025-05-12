// --- Anime.js Title Animation ---
    var textWrapper = document.querySelector('.ml2');
    if (textWrapper) {
        textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
        anime.timeline({loop: false})
        .add({
            targets: '.ml2 .letter',
            scale: [4,1], opacity: [0,1], translateZ: 0,
            easing: "easeOutExpo", duration: 950,
            delay: (el, i) => 70*i
        }).add({
            targets: '.ml2', opacity: 1, duration: 1000,
            easing: "easeOutExpo", delay: 1000
        });
    }

    // --- DOM Elements ---
    const dropzone = document.getElementById('dropzone');
    const passwordSection = document.getElementById('password-section');
    const passwordInput = document.getElementById('password');
    const passwordLabel = document.getElementById('password-label');
    const filenameInput = document.getElementById('filename');
    const filenameLabel = document.getElementById('filename-label');
    const submitPasswordButton = document.getElementById('submit-password-button');
    const statusMessageEl = document.getElementById('status-message');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const fileInputFiles = document.getElementById('file-input-files');
    const fileInputFolder = document.getElementById('file-input-folder');
    const selectFilesButton = document.getElementById('select-files-button');
    const selectFolderButton = document.getElementById('select-folder-button');

    let currentFiles = null;
    let currentAction = null; // 'encrypt' or 'decrypt'

    // --- UI Helper Functions ---
    function showElement(el, isFlex = false) {
        el.style.display = isFlex ? 'flex' : 'block';
        el.classList.add('fade-slide-in');
        // Ensure animation restarts if element was hidden and shown again
        el.style.animation = 'none';
        el.offsetHeight; /* trigger reflow */
        el.style.animation = null;
    }

    function hideElement(el) {
        el.style.display = 'none';
        el.classList.remove('fade-slide-in');
    }

    function updateProgress(value, text = null) {
        const percentage = Math.max(0, Math.min(100, Math.round(value)));
        progressBar.style.width = percentage + '%';
        progressBar.textContent = text !== null ? text : percentage + '%';
        if (percentage > 0 && progressContainer.style.display === 'none') {
            showElement(progressContainer);
        }
    }

    function setStatus(message, type = 'info', permanent = false) { // type: 'info', 'success', 'error'
        statusMessageEl.textContent = message;
        statusMessageEl.className = 'status-message visible ' + type; // Add type class for color

        if (!permanent && message) {
            setTimeout(() => {
                if (statusMessageEl.textContent === message) { // Clear only if message hasn't changed
                    statusMessageEl.textContent = '';
                    statusMessageEl.className = 'status-message'; // Remove visible and type
                }
            }, type === 'error' ? 8000 : 5000);
        } else if (!message) {
            statusMessageEl.className = 'status-message';
        }
    }

    function resetUIState() {
        hideElement(passwordSection);
        hideElement(progressContainer);
        updateProgress(0, '0%');
        passwordInput.value = '';
        filenameInput.value = '';
        currentFiles = null;
        currentAction = null;
        submitPasswordButton.disabled = false;
        submitPasswordButton.textContent = 'Proceed';
        setStatus(''); // Clear status message
        fileInputFiles.value = null; // Reset file inputs
        fileInputFolder.value = null;
    }

    // --- Event Listeners for File Input ---
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files);
        }
    });

    selectFilesButton.addEventListener('click', () => fileInputFiles.click());
    selectFolderButton.addEventListener('click', () => fileInputFolder.click());

    fileInputFiles.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelection(e.target.files);
    });
    fileInputFolder.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelection(e.target.files);
    });


    function handleFileSelection(files) {
        resetUIState();
        currentFiles = files;

        if (!files || files.length === 0) {
            setStatus("No files selected. Please try again.", 'error');
            return;
        }

        const allAreEncryptit = Array.from(files).every(file => file.name.toLowerCase().endsWith('.encryptit'));
        const someAreEncryptit = Array.from(files).some(file => file.name.toLowerCase().endsWith('.encryptit'));

        if (allAreEncryptit) {
            currentAction = 'decrypt';
            passwordLabel.textContent = `Password to decrypt ${files.length} .encryptit file(s):`;
            hideElement(filenameInput);
            hideElement(filenameLabel);
            setStatus(`Ready to decrypt. Enter password.`, 'info');
        } else if (!allAreEncryptit && someAreEncryptit) {
            setStatus("Mixed files found! Please select EITHER only '.encryptit' files (to decrypt) OR only other file types (to encrypt).", 'error', true);
            return; // Do not show password prompt
        } else {
            currentAction = 'encrypt';
            passwordLabel.textContent = `Password to encrypt ${files.length} file(s):`;
            showElement(filenameLabel);
            showElement(filenameInput, true); // isFlex = true for correct display if it becomes flex
            const firstFile = files[0];
            let baseName = firstFile.name.substring(0, firstFile.name.lastIndexOf('.')) || firstFile.name;
            if (baseName.length > 30) baseName = baseName.substring(0,30) + "..."; // Truncate long names
            filenameInput.value = `${baseName}_encrypted.encryptit`;
            setStatus(`Ready to encrypt. Enter password and confirm filename.`, 'info');
        }
        showElement(passwordSection, true); // isFlex = true for password section
        passwordInput.focus();
    }

    submitPasswordButton.addEventListener('click', async () => {
        const password = passwordInput.value;
        const outputFilename = filenameInput.value.trim();

        if (!password) {
            setStatus("Password is required!", 'error');
            passwordInput.focus(); return;
        }
        if (currentAction === 'encrypt') {
            if (!outputFilename) {
                setStatus("Output filename is required for encryption.", 'error');
                filenameInput.focus(); return;
            }
            if (!outputFilename.toLowerCase().endsWith('.encryptit')) {
                 setStatus("Output filename must end with .encryptit", 'error');
                 filenameInput.focus(); return;
            }
        }

        submitPasswordButton.disabled = true;
        submitPasswordButton.textContent = 'Processing...';
        showElement(progressContainer);
        updateProgress(0, 'Initializing...');
        setStatus("Processing your files... please wait.", 'info', true);

        try {
            if (currentAction === 'encrypt') {
                await encryptFiles(currentFiles, password, outputFilename);
                setStatus(`Encryption complete! '${outputFilename}' download started.`, 'success', false);
            } else if (currentAction === 'decrypt') {
                await decryptFiles(currentFiles, password);
                setStatus(`Decryption process finished. Check your downloads.`, 'success', false);
            }
             // On success, keep progress at 100%. Button remains disabled until new files are selected.
        } catch (error) {
            console.error("Operation failed:", error);
            setStatus(`Error: ${error.message || 'An unknown error occurred.'}`, 'error', true);
            updateProgress(0, 'Error'); // Optionally show error on progress bar or reset it
            submitPasswordButton.textContent = 'Proceed'; // Allow retry if it's a recoverable error
            submitPasswordButton.disabled = false; // Re-enable for retry on same files/password if appropriate
                                                 // Or keep disabled to force re-selection:
                                                 // submitPasswordButton.disabled = true; (as it was)
        }
        // Removed the general 'finally' block for button re-enabling to handle it more contextually (e.g. on error for retries)
        // If an operation is fully successful, user should select new files to start over, which calls resetUIState().
    });


    // --- Cryptographic Constants & Functions ---
    const PBKDF2_ITERATIONS = 100000;
    const SALT_LENGTH = 16; // Bytes
    const IV_LENGTH = 12; // Bytes for AES-GCM

    async function deriveKey(password, salt, progressStart, progressWeight) {
        updateProgress(progressStart, 'Deriving key...');
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
        );
        const derivedKey = await window.crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
        );
        updateProgress(progressStart + progressWeight, 'Key derived');
        return derivedKey;
    }

    async function encryptFiles(files, password, outputFilename) {
        let currentProgress = 0;
        const updateTotalProgress = (increment, stageText) => {
            currentProgress += increment;
            updateProgress(currentProgress, stageText);
        };

        updateTotalProgress(5, 'Preparing files...');
        const zip = new JSZip();
        const totalFiles = files.length;
        const fileReadIncrement = 25 / totalFiles; // Allocate 25% for reading all files

        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const arrayBuffer = await file.arrayBuffer();
            const path = file.webkitRelativePath || file.name;
            zip.file(path, arrayBuffer);
            updateTotalProgress(fileReadIncrement, `Added ${i + 1}/${totalFiles} to archive`);
        }
        currentProgress = 30; // After file reading

        updateProgress(currentProgress, "Compressing archive...");
        const zipCompressionWeight = 25; // Allocate 25% for zipping
        const zipBlob = await zip.generateAsync(
            { type: "arraybuffer", compression: "DEFLATE", compressionOptions: { level: 9 } },
            (metadata) => { // JSZip progress callback
                updateProgress(currentProgress + (metadata.percent / 100 * zipCompressionWeight), `Compressing: ${Math.round(metadata.percent)}%`);
            }
        );
        currentProgress += zipCompressionWeight; // currentProgress is now 55%
        updateProgress(currentProgress, 'Compression complete.');

        const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        const keyDerivationWeight = 15; // Allocate 15% for key derivation
        const key = await deriveKey(password, salt, currentProgress, keyDerivationWeight);
        currentProgress += keyDerivationWeight; // currentProgress is now 70%

        updateProgress(currentProgress, 'Encrypting data...');
        const encryptionWeight = 25; // Allocate 25% for encryption
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv }, key, zipBlob
        );
        currentProgress += encryptionWeight; // currentProgress is now 95%
        updateProgress(currentProgress, 'Encryption complete.');

        const finalBuffer = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
        finalBuffer.set(salt, 0);
        finalBuffer.set(iv, salt.length);
        finalBuffer.set(new Uint8Array(encryptedContent), salt.length + iv.length);

        triggerDownload(outputFilename, finalBuffer.buffer);
        updateProgress(100, 'Download initiated!');
    }

    async function decryptFiles(filesToProcess, password) {
        const totalOuterFiles = filesToProcess.length;
        let outerProgressAccumulator = 0;

        for (let i = 0; i < totalOuterFiles; i++) {
            const file = filesToProcess[i];
            const baseFileProgress = (i / totalOuterFiles) * 100; // Progress before this file starts
            let currentFileInnerProgress = 0;
            const fileOverallWeight = 100 / totalOuterFiles; // How much this single .encryptit file contributes to total 100%

            const updateInnerProgress = (increment, stageText) => {
                currentFileInnerProgress += increment;
                // Global progress = progress of previous files + (current file's inner progress ratio * its weight)
                updateProgress(baseFileProgress + (currentFileInnerProgress / 100 * fileOverallWeight), stageText);
            };

            updateInnerProgress(5, `Reading ${file.name.substring(0,15)}...`);
            const fileBuffer = await file.arrayBuffer();

            updateInnerProgress(10, 'Extracting metadata...');
            const salt = new Uint8Array(fileBuffer.slice(0, SALT_LENGTH));
            const iv = new Uint8Array(fileBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH));
            const encryptedContent = fileBuffer.slice(SALT_LENGTH + IV_LENGTH);

            if (!salt.length || !iv.length || !encryptedContent.byteLength) {
                throw new Error(`File ${file.name} is invalid or corrupted.`);
            }

            const keyDerivationWeight = 20; // Inner percentage for key derivation
            const key = await deriveKey(password, salt, baseFileProgress + (currentFileInnerProgress/100 * fileOverallWeight), (keyDerivationWeight/100 * fileOverallWeight));
            currentFileInnerProgress += keyDerivationWeight; // Add to inner progress

            updateInnerProgress(20, `Decrypting ${file.name.substring(0,15)}...`); // Decryption takes 20% (inner)
            let decryptedZipBuffer;
            try {
                decryptedZipBuffer = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv }, key, encryptedContent
                );
            } catch (e) {
                console.error("Decryption failed:", e);
                throw new Error(`Decryption failed for ${file.name}. Incorrect password or corrupted file.`);
            }

            updateInnerProgress(10, `Loading archive from ${file.name.substring(0,10)}...`); // Loading zip takes 10%
            const zip = new JSZip();
            try {
                await zip.loadAsync(decryptedZipBuffer);
            } catch (e) {
                console.error("Failed to load zip archive:", e);
                throw new Error(`Corrupted archive in ${file.name}.`);
            }

            const filesInZip = Object.keys(zip.files).filter(name => !zip.files[name].dir);
            const totalFilesInArchive = filesInZip.length;
            const extractionTotalWeight = 35; // Remaining 35% (inner) for extraction

            if (totalFilesInArchive === 0) {
                setStatus(`Archive ${file.name} is empty.`, 'info');
                updateInnerProgress(extractionTotalWeight, `Empty archive: ${file.name.substring(0,10)}`);
            } else {
                 for (let j = 0; j < totalFilesInArchive; j++) {
                    const filenameInZip = filesInZip[j];
                    const fileData = await zip.file(filenameInZip).async("arraybuffer");
                    const originalName = filenameInZip.split('/').pop() || filenameInZip;
                    triggerDownload(originalName, fileData);
                    updateInnerProgress(extractionTotalWeight / totalFilesInArchive, `Extracted ${originalName.substring(0,10)}...`);
                }
            }
            setStatus(`Finished processing ${file.name}.`, 'info');
        }
        updateProgress(100, 'All files processed!');
    }

    function triggerDownload(filename, data, mimeType = 'application/octet-stream') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            // console.log(`Download triggered for: ${filename}`); // Keep for debugging if needed
        }, 300); // Slightly longer delay for safety
    }

    // --- Initial Page Setup ---
    resetUIState(); // Ensures clean state on load/refresh
    document.addEventListener('DOMContentLoaded', () => {
        // Call resetUIState again or specific hide calls if elements might be visible due to browser caching of styles
        hideElement(passwordSection);
        hideElement(progressContainer);
        hideElement(statusMessageEl); // Ensure status is initially hidden
    });