let booksMap = new Map();
let currentBookName = null;
let currentTrackIndex = 0;
let audioElement = new Audio();
let isPlaying = false;

const viewBookshelf = document.getElementById('bookshelf-view');
const viewPlayer = document.getElementById('player-view');
const welcomeScreen = document.getElementById('welcome-screen');
const bookListEl = document.getElementById('book-list');
const btnSelectFolder = document.getElementById('btn-select-folder');
const btnBackShelf = document.getElementById('btn-back-shelf');
const currentBookTitleEl = document.getElementById('current-book-title');
const currentChapterTitleEl = document.getElementById('current-chapter-title');
const btnPlayPause = document.getElementById('btn-play-pause');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const btnSkipBack = document.getElementById('btn-skip-back');
const btnSkipForward = document.getElementById('btn-skip-forward');

function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

window.addEventListener('DOMContentLoaded', async () => {
    if ('showDirectoryPicker' in window) {
        try {
            await loadSavedState();
        } catch (e) {}
    }
});

btnSelectFolder.addEventListener('click', async () => {
    try {
        const dirHandle = await window.showDirectoryPicker();
        await scanAudiobooksFolder(dirHandle);
        saveFolderHandle(dirHandle);
    } catch (err) {
        if (err.name !== 'AbortError') {
            alert('Could not access folder. Please try again.');
        }
    }
});

async function scanAudiobooksFolder(rootHandle) {
    booksMap.clear();
    bookListEl.innerHTML = '';

    for await (const [name, handle] of rootHandle.entries()) {
        if (handle.kind === 'directory') {
            const chapterHandles = [];
            for await (const [subName, subHandle] of handle.entries()) {
                if (subHandle.kind === 'file' && subName.toLowerCase().endsWith('.mp3')) {
                    chapterHandles.push({ name: subName, handle: subHandle });
                }
            }
            if (chapterHandles.length > 0) {
                chapterHandles.sort((a, b) => naturalSort(a.name, b.name));
                booksMap.set(name, chapterHandles);
            }
        }
    }
    renderBookshelf();
}

function renderBookshelf() {
    bookListEl.innerHTML = '';
    if (booksMap.size === 0) {
        welcomeScreen.classList.remove('hidden');
        bookListEl.classList.add('hidden');
        alert('No audiobook folders with MP3 files were found.');
        return;
    }

    welcomeScreen.classList.add('hidden');
    bookListEl.classList.remove('hidden');

    const sortedBookNames = Array.from(booksMap.keys()).sort(naturalSort);
    sortedBookNames.forEach(bookName => {
        const btn = document.createElement('button');
        btn.className = 'book-item';
        btn.textContent = bookName.replace(/[_]/g, ' ');
        btn.addEventListener('click', () => openBook(bookName));
        bookListEl.appendChild(btn);
    });
}

function openBook(bookName) {
    currentBookName = bookName;
    currentBookTitleEl.textContent = bookName.replace(/[_]/g, ' ');
    loadBookProgress(bookName);
    viewBookshelf.classList.remove('active');
    viewPlayer.classList.add('active');
    loadAndPlayCurrentTrack(false);
}

async function loadAndPlayCurrentTrack(autoPlay = true) {
    const chapters = booksMap.get(currentBookName);
    if (!chapters || chapters.length === 0) return;

    if (currentTrackIndex < 0) currentTrackIndex = 0;
    if (currentTrackIndex >= chapters.length) currentTrackIndex = chapters.length - 1;

    const currentChapter = chapters[currentTrackIndex];
    currentChapterTitleEl.textContent = currentChapter.name.replace(/\.[^/.]+$/, "").replace(/[_]/g, ' ');

    try {
        const file = await currentChapter.handle.getFile();
        audioElement.src = URL.createObjectURL(file);
        audioElement.currentTime = getSavedChapterTime(currentBookName, currentTrackIndex);

        if (autoPlay || isPlaying) {
            audioElement.play().then(() => setPlayingState(true)).catch(() => setPlayingState(false));
        } else {
            setPlayingState(false);
        }
    } catch (err) {
        currentChapterTitleEl.textContent = "Error loading file";
    }
}

audioElement.addEventListener('ended', () => {
    const chapters = booksMap.get(currentBookName);
    if (chapters && currentTrackIndex < chapters.length - 1) {
        currentTrackIndex++;
        saveProgress();
        loadAndPlayCurrentTrack(true);
    } else {
        setPlayingState(false);
        currentChapterTitleEl.textContent = "Finished Book";
    }
});

audioElement.addEventListener('timeupdate', () => {
    saveProgress();
});

btnPlayPause.addEventListener('click', () => {
    if (audioElement.paused) {
        if (!audioElement.src && currentBookName) {
            loadAndPlayCurrentTrack(true);
        } else {
            audioElement.play();
            setPlayingState(true);
        }
    } else {
        audioElement.pause();
        setPlayingState(false);
    }
});

btnSkipBack.addEventListener('click', () => {
    audioElement.currentTime = Math.max(0, audioElement.currentTime - 30);
});

btnSkipForward.addEventListener('click', () => {
    const chapters = booksMap.get(currentBookName);
    if (audioElement.duration && audioElement.currentTime + 30 < audioElement.duration) {
        audioElement.currentTime += 30;
    } else {
        if (chapters && currentTrackIndex < chapters.length - 1) {
            currentTrackIndex++;
            loadAndPlayCurrentTrack(true);
        }
    }
});

btnBackShelf.addEventListener('click', () => {
    audioElement.pause();
    setPlayingState(false);
    saveProgress();
    viewPlayer.classList.remove('active');
    viewBookshelf.classList.add('active');
});

function setPlayingState(playing) {
    isPlaying = playing;
    if (playing) {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
    } else {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
    }
}

function saveProgress() {
    if (!currentBookName) return;
    localStorage.setItem(`audiobook_progress_${currentBookName}`, JSON.stringify({
        trackIndex: currentTrackIndex,
        currentTime: audioElement.currentTime
    }));
}

function loadBookProgress(bookName) {
    const saved = localStorage.getItem(`audiobook_progress_${bookName}`);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            currentTrackIndex = data.trackIndex || 0;
            return;
        } catch (e) {}
    }
    currentTrackIndex = 0;
}

function getSavedChapterTime(bookName, trackIndex) {
    const saved = localStorage.getItem(`audiobook_progress_${bookName}`);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.trackIndex === trackIndex) return data.currentTime || 0;
        } catch (e) {}
    }
    return 0;
}

const DB_NAME = 'AudiobookPWA';
const STORE_NAME = 'handles';

function saveFolderHandle(dirHandle) {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    request.onsuccess = (e) => {
        e.target.result.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(dirHandle, 'rootFolder');
    };
}

async function loadSavedState() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = async (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                resolve();
                return;
            }
            const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get('rootFolder');
            req.onsuccess = async () => {
                const dirHandle = req.result;
                if (dirHandle) {
                    const permission = await dirHandle.queryPermission({ mode: 'read' });
                    if (permission === 'granted') {
                        await scanAudiobooksFolder(dirHandle);
                    } else {
                        btnSelectFolder.onclick = async () => {
                            if (await dirHandle.requestPermission({ mode: 'read' }) === 'granted') {
                                await scanAudiobooksFolder(dirHandle);
                            }
                        };
                        welcomeScreen.querySelector('.instruction-text').textContent = 'Tap below to reconnect to your Audiobooks folder.';
                    }
                }
                resolve();
            };
            req.onerror = () => resolve();
        };
        request.onerror = () => resolve();
    });
}
