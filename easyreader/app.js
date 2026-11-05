'use strict';

/*
 * Easy Audiobook Player
 *
 * How it works:
 *  - A helper picks the "Audiobooks" folder ONCE (Add or remove books screen).
 *    The MP3 files are copied into the app's private file storage (OPFS), so the
 *    app never needs folder permission again and works offline.
 *  - The library (titles + chapter lists) is a small JSON blob in localStorage.
 *  - Listening position is saved per book in localStorage.
 */

const APP_VERSION = '2.0.1';
const LIB_KEY = 'er_library_v1';
const PROGRESS_PREFIX = 'er_progress_';
const SKIP_SECONDS = 30;
const RESUME_BACKUP_SECONDS = 5;       // when reopening a book, back up a few seconds

/* =====================================================================
 * Small helpers
 * ===================================================================== */

const $ = (id) => document.getElementById(id);
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function prettyName(name) {
    return name.replace(/\.mp3$/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

function fmtBytes(n) {
    if (!isFinite(n)) return '?';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB';
    if (n >= 1e6) return Math.round(n / 1e6) + ' MB';
    return Math.round(n / 1e3) + ' KB';
}

function hashId(text) {                       // small stable id from a book title
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return 'b' + (h >>> 0).toString(36);
}

function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
}

/* =====================================================================
 * Library + progress (localStorage)
 * ===================================================================== */

function loadLibrary() {
    try {
        const lib = JSON.parse(localStorage.getItem(LIB_KEY) || 'null');
        if (lib && Array.isArray(lib.books)) return lib;
    } catch (e) { /* fall through */ }
    return { books: [] };
}

function saveLibrary(lib) {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
}

function readProgress(bookId) {
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_PREFIX + bookId) || 'null');
    } catch (e) {
        return null;
    }
}

function writeProgress(bookId, data) {
    try {
        localStorage.setItem(PROGRESS_PREFIX + bookId, JSON.stringify({ ...data, t: Date.now() }));
    } catch (e) { /* storage full or blocked: not fatal */ }
}

/* =====================================================================
 * File storage (OPFS)
 * ===================================================================== */

async function booksRoot() {
    const root = await navigator.storage.getDirectory();
    return root.getDirectoryHandle('books', { create: true });
}

async function getChapterFile(book, index) {
    const root = await booksRoot();
    const dir = await root.getDirectoryHandle(book.id);
    const handle = await dir.getFileHandle(book.chapters[index].file);
    return handle.getFile();
}

/* =====================================================================
 * Screens + history (so the Android Back button works sensibly)
 * ===================================================================== */

const views = {
    shelf: $('view-shelf'),
    player: $('view-player'),
    manage: $('view-manage')
};
let currentView = 'shelf';

function show(name) {
    for (const [key, node] of Object.entries(views)) node.classList.toggle('active', key === name);
    currentView = name;
}

function go(name) {
    show(name);
    history.pushState({ v: name }, '');
}

function goBack() {
    if (history.state && history.state.v && history.state.v !== 'shelf') history.back();
    else onLeave('shelf');
}

function onLeave(target) {
    if (currentView === 'player') leavePlayer();
    if (target === 'shelf') renderShelf();
    show(target);
}

window.addEventListener('popstate', (e) => {
    onLeave((e.state && e.state.v) || 'shelf');
});

/* =====================================================================
 * Bookshelf
 * ===================================================================== */

function renderShelf() {
    const lib = loadLibrary();
    const list = $('book-list');
    list.textContent = '';

    const none = lib.books.length === 0;
    $('empty').classList.toggle('hidden', !none);
    list.classList.toggle('hidden', none);
    $('btn-manage').classList.toggle('hidden', none);

    const items = lib.books
        .map((b) => ({ b, p: readProgress(b.id) }))
        .sort((x, y) => ((y.p && y.p.t) || 0) - ((x.p && x.p.t) || 0) || collator.compare(x.b.title, y.b.title));

    items.forEach(({ b, p }, i) => {
        const btn = el('button', 'book-item');
        const n = b.chapters.length;
        let sub;
        if (!p) sub = 'Tap to start listening';
        else if (p.finished) sub = 'Finished. Tap to listen again';
        else sub = 'Continue listening' + (n > 1 ? ` (chapter ${p.track + 1} of ${n})` : '');
        if (i === 0 && p && !p.finished) btn.classList.add('recent');
        btn.append(el('span', 'book-title', b.title), el('span', 'book-sub', sub));
        btn.addEventListener('click', () => openBook(b));
        list.appendChild(btn);
    });
}

/* =====================================================================
 * Player
 * ===================================================================== */

const audio = new Audio();
audio.preload = 'auto';

let book = null;            // the book being played
let track = 0;              // index of current chapter
let intendPlay = false;     // what the listener wants: playing or paused
let switching = false;      // true while a chapter is being loaded
let finished = false;       // reached the end of the last chapter
let pendingSeek = null;     // seconds to jump to once metadata loads (negative = from the end)
let objectUrl = null;
let loadToken = 0;          // lets a newer load cancel an older one
let pausedAt = 0;
let lastSave = 0;
let lastAnnounced = '';

function setStatus(text) {
    $('p-status').textContent = text || '';
}

async function openBook(b) {
    book = b;
    finished = false;
    setStatus('');
    const p = readProgress(b.id);
    let index = 0;
    let time = 0;
    if (p && !p.finished && Number.isInteger(p.track) && p.track >= 0 && p.track < b.chapters.length) {
        index = p.track;
        time = Math.max(0, (p.time || 0) - RESUME_BACKUP_SECONDS);
    }
    $('p-title').textContent = b.title;
    go('player');
    await loadTrack(index, { startAt: time, play: true });
}

async function loadTrack(index, { startAt = 0, play = true } = {}) {
    const token = ++loadToken;
    track = index;
    finished = false;
    intendPlay = play;
    switching = true;
    setStatus('');
    renderPlayer();
    try {
        const file = await getChapterFile(book, index);
        if (token !== loadToken) return;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(file);
        pendingSeek = startAt;
        audio.src = objectUrl;
        // Record the new position straight away, so progress is never left
        // pointing at the old chapter's time.
        writeProgress(book.id, { track: index, time: Math.max(0, startAt) });
        updateMediaSession();
        if (intendPlay) {
            try {
                await audio.play();
            } catch (err) {
                if (token === loadToken) handlePlayError(err);
            }
        }
    } catch (err) {
        if (token === loadToken) {
            intendPlay = false;
            setStatus('Sorry, this part of the book could not be opened. Please ask for help.');
        }
    } finally {
        if (token === loadToken) {
            switching = false;
            renderPlayer();
        }
    }
}

function handlePlayError(err) {
    if (err && err.name === 'AbortError') return;      // interrupted by a newer action
    intendPlay = false;
    setStatus(err && err.name === 'NotAllowedError' ? 'Tap Play to start.' : 'Sorry, this could not be played.');
    renderPlayer();
}

function togglePlay() {
    if (!book) return;
    if (finished) {
        loadTrack(0, { startAt: 0, play: true });
        return;
    }
    if (switching) {                                   // chapter still loading: just flip the intent
        intendPlay = !intendPlay;
        if (!intendPlay) audio.pause();
        renderPlayer();
        return;
    }
    if (intendPlay) {
        intendPlay = false;
        audio.pause();
    } else {
        if (!audio.src) {
            loadTrack(track, { startAt: 0, play: true });
            return;
        }
        intendPlay = true;
        setStatus('');
        // After a long pause, back up a few seconds so she can pick up the thread.
        if (pausedAt && Date.now() - pausedAt > 60000 && audio.currentTime > RESUME_BACKUP_SECONDS) {
            audio.currentTime -= RESUME_BACKUP_SECONDS;
        }
        audio.play().catch(handlePlayError);
    }
    renderPlayer();
}

function skip(delta) {
    if (!book || switching || pendingSeek !== null || finished) return;
    const t = audio.currentTime;
    const d = audio.duration;
    if (!isFinite(d)) return;
    const target = t + delta;
    const last = book.chapters.length - 1;
    if (target < 0) {
        if (track > 0) loadTrack(track - 1, { startAt: target, play: intendPlay });   // negative = from the end
        else audio.currentTime = 0;
    } else if (target >= d - 1) {
        if (track < last) loadTrack(track + 1, { startAt: 0, play: intendPlay });
        else audio.currentTime = d;                    // jumps to the end of the book
    } else {
        audio.currentTime = target;
    }
}

function changeChapter(direction) {                   // used by headphone / lock-screen buttons
    if (!book || switching) return;
    if (direction < 0) {
        if (audio.currentTime > 5 || track === 0) audio.currentTime = 0;
        else loadTrack(track - 1, { startAt: 0, play: intendPlay });
    } else if (track < book.chapters.length - 1) {
        loadTrack(track + 1, { startAt: 0, play: intendPlay });
    }
}

function saveNow(force) {
    if (!book || finished || switching || pendingSeek !== null) return;
    const now = Date.now();
    if (!force && now - lastSave < 3000) return;
    lastSave = now;
    writeProgress(book.id, { track, time: audio.currentTime });
}

function leavePlayer() {
    saveNow(true);
    loadToken++;                                       // cancel any chapter still loading
    switching = false;
    intendPlay = false;
    audio.pause();
    if ('mediaSession' in navigator) {
        try { navigator.mediaSession.playbackState = 'paused'; } catch (e) { /* ignore */ }
    }
    book = null;
}

/* ---------- drawing the player ---------- */

function renderPlayer() {
    if (!book) return;
    const n = book.chapters.length;
    $('p-chapter').textContent = finished ? 'The End' : (n > 1 ? `Chapter ${track + 1} of ${n}` : '');

    const playing = intendPlay && !finished;
    $('icon-play').classList.toggle('hidden', playing);
    $('icon-pause').classList.toggle('hidden', !playing);
    const label = finished ? 'Listen again' : (playing ? 'Pause' : 'Play');
    $('play-label').textContent = label;

    const announce = finished ? 'The end of the book' : (playing ? 'Playing' : 'Paused');
    if (announce !== lastAnnounced) {
        lastAnnounced = announce;
        $('sr-state').textContent = announce;
    }
    if ('mediaSession' in navigator) {
        try { navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch (e) { /* ignore */ }
    }
    renderProgress();
}

function renderProgress() {
    const d = audio.duration;
    const t = audio.currentTime;
    const ok = book && !finished && !switching && pendingSeek === null && isFinite(d) && d > 0;
    const pct = ok ? Math.min(100, (100 * t) / d) : 0;
    $('bar-fill').style.width = pct + '%';
    $('bar').setAttribute('aria-valuenow', String(Math.round(pct)));
    $('p-time').textContent = ok ? `${fmtTime(t)} of ${fmtTime(d)}` : '';
}

/* ---------- audio events ---------- */

audio.addEventListener('loadedmetadata', () => {
    if (pendingSeek !== null) {
        const d = audio.duration;
        let t = pendingSeek >= 0 ? pendingSeek : d + pendingSeek;
        t = Math.max(0, t);
        if (isFinite(d)) t = Math.min(t, Math.max(0, d - 1));
        pendingSeek = null;
        if (t > 0.1) audio.currentTime = t;
    }
    renderProgress();
});

audio.addEventListener('timeupdate', () => {
    renderProgress();
    saveNow(false);
    if ('mediaSession' in navigator && navigator.mediaSession.setPositionState &&
        isFinite(audio.duration) && audio.duration > 0) {
        try {
            navigator.mediaSession.setPositionState({
                duration: audio.duration,
                position: Math.min(audio.currentTime, audio.duration),
                playbackRate: audio.playbackRate || 1
            });
        } catch (e) { /* ignore */ }
    }
});

audio.addEventListener('play', () => {
    if (!book) return;
    intendPlay = true;
    renderPlayer();
});

audio.addEventListener('pause', () => {
    if (!book) return;
    if (!switching && !finished && !audio.ended) {
        intendPlay = false;                            // e.g. a phone call or headphones unplugged
        pausedAt = Date.now();
        saveNow(true);
    }
    renderPlayer();
});

audio.addEventListener('ended', () => {
    if (!book) return;
    if (track < book.chapters.length - 1) {
        loadTrack(track + 1, { startAt: 0, play: true });
    } else {
        finished = true;
        intendPlay = false;
        writeProgress(book.id, { track: 0, time: 0, finished: true });
        setStatus('You have reached the end of the book.');
        renderPlayer();
    }
});

audio.addEventListener('error', () => {
    if (!book || !audio.src) return;
    intendPlay = false;
    switching = false;
    setStatus('Sorry, this part of the book could not be played. Please ask for help.');
    renderPlayer();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveNow(true);
});
window.addEventListener('pagehide', () => saveNow(true));

/* ---------- lock screen / headphone controls ---------- */

function updateMediaSession() {
    if (!('mediaSession' in navigator) || !book || typeof MediaMetadata === 'undefined') return;
    try {
        const n = book.chapters.length;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: book.title,
            artist: n > 1 ? `Chapter ${track + 1} of ${n}` : 'Audiobook',
            album: 'Audiobooks',
            artwork: [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }]
        });
    } catch (e) { /* ignore */ }
}

function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const set = (action, fn) => {
        try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* unsupported action */ }
    };
    set('play', () => { if (book && !intendPlay) togglePlay(); });
    set('pause', () => { if (book && intendPlay) togglePlay(); });
    set('seekbackward', () => skip(-SKIP_SECONDS));
    set('seekforward', () => skip(SKIP_SECONDS));
    set('previoustrack', () => changeChapter(-1));
    set('nexttrack', () => changeChapter(1));
}

/* ---------- buttons ---------- */

$('btn-play').addEventListener('click', togglePlay);
$('btn-back').addEventListener('click', () => skip(-SKIP_SECONDS));
$('btn-fwd').addEventListener('click', () => skip(SKIP_SECONDS));
$('btn-books').addEventListener('click', goBack);

/* =====================================================================
 * Add / remove books (helper screen)
 * ===================================================================== */

let pendingGroups = [];     // [{ title, files: [File...] }] waiting for confirmation
let importing = false;

$('btn-manage').addEventListener('click', openManage);
$('btn-add-empty').addEventListener('click', openManage);
$('btn-manage-done').addEventListener('click', goBack);
$('btn-pick-folder').addEventListener('click', () => $('in-folder').click());
$('btn-pick-files').addEventListener('click', () => $('in-files').click());
$('btn-cancel-import').addEventListener('click', () => { pendingGroups = []; $('preview').classList.add('hidden'); });
$('btn-import').addEventListener('click', runImport);

$('in-folder').addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    onPicked(files, 'folder');
});
$('in-files').addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    onPicked(files, 'files');
});

function openManage() {
    renderManage();
    $('preview').classList.add('hidden');
    $('import-result').classList.add('hidden');
    go('manage');
}

function relParts(f) {
    return (f.webkitRelativePath || '').split('/').filter(Boolean);
}

// True when the chosen folder holds 2+ MP3s directly and no subfolders with MP3s:
// most likely the person picked ONE book's folder, not the whole Audiobooks folder.
function looksLikeSingleBookFolder(files, mode) {
    if (mode !== 'folder') return false;
    const mp3s = files.filter((f) => /\.mp3$/i.test(f.name));
    return mp3s.length >= 2 && mp3s.every((f) => relParts(f).length === 2);
}

function groupFiles(files, mode, asOneBook) {
    const groups = new Map();
    const add = (title, f) => {
        if (!groups.has(title)) groups.set(title, []);
        groups.get(title).push(f);
    };
    for (const f of files) {
        if (!/\.mp3$/i.test(f.name)) continue;
        const parts = relParts(f);
        // Audiobooks / BookName / [subfolders /] chapter.mp3  ->  book = BookName
        if (mode === 'folder' && parts.length >= 3) add(prettyName(parts[1]), f);
        else if (asOneBook && parts.length === 2) add(prettyName(parts[0]), f);   // chosen folder = one book
        else add(prettyName(f.name), f);               // a loose file is a book by itself
    }
    return Array.from(groups, ([title, list]) => ({
        title,
        files: list.sort((a, b) => collator.compare(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name))
    })).sort((a, b) => collator.compare(a.title, b.title));
}

let lastPick = null;        // { files, mode, oneBook } so the preview can be regrouped

function onPicked(files, mode) {
    lastPick = { files, mode, oneBook: looksLikeSingleBookFolder(files, mode) };
    renderPreview();
}

$('btn-regroup').addEventListener('click', () => {
    if (!lastPick) return;
    lastPick.oneBook = !lastPick.oneBook;
    renderPreview();
});

function renderPreview() {
    const { files, mode, oneBook } = lastPick;
    const result = $('import-result');
    result.classList.add('hidden');
    pendingGroups = groupFiles(files, mode, oneBook);

    // Offer the other interpretation when the folder could be read either way.
    const ambiguous = looksLikeSingleBookFolder(files, mode);
    $('regroup-note').classList.toggle('hidden', !ambiguous);
    $('btn-regroup').classList.toggle('hidden', !ambiguous);
    if (ambiguous) {
        $('regroup-note').textContent = oneBook
            ? 'All these MP3 files are directly inside the chosen folder, so they are being added as ONE book (the files are its chapters).'
            : 'These MP3 files are being added as SEPARATE books, one per file.';
        $('btn-regroup').textContent = oneBook ? 'No, make each file its own book' : 'No, make them one book';
    }

    const list = $('preview-list');
    list.textContent = '';
    if (pendingGroups.length === 0) {
        $('preview').classList.add('hidden');
        result.textContent = 'No MP3 files were found in what was chosen. Please try again.';
        result.classList.add('error');
        result.classList.remove('hidden');
        result.scrollIntoView({ block: 'nearest' });
        return;
    }
    for (const g of pendingGroups) {
        const li = el('li');
        const info = el('span', 'name', g.title);
        const size = g.files.reduce((s, f) => s + f.size, 0);
        info.append(el('span', 'meta', `${g.files.length} ${g.files.length === 1 ? 'file' : 'files'}, ${fmtBytes(size)}`));
        li.appendChild(info);
        list.appendChild(li);
    }
    $('btn-import').textContent = pendingGroups.length === 1 ? 'Add this book' : `Add these ${pendingGroups.length} books`;
    $('preview').classList.remove('hidden');
    $('preview').scrollIntoView({ block: 'nearest' });
}

async function copyFile(dir, name, file, onBytes) {
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    try {
        const reader = file.stream().getReader();
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            await writable.write(value);
            onBytes(value.byteLength);
        }
        await writable.close();
    } catch (err) {
        try { await writable.abort(); } catch (e) { /* ignore */ }
        throw err;
    }
}

async function runImport() {
    if (importing || pendingGroups.length === 0) return;
    importing = true;
    const groups = pendingGroups;
    pendingGroups = [];
    $('preview').classList.add('hidden');
    const result = $('import-result');
    result.classList.add('hidden');
    result.classList.remove('error');
    $('progress-panel').classList.remove('hidden');
    $('progress-panel').scrollIntoView({ block: 'nearest' });
    for (const id of ['btn-pick-folder', 'btn-pick-files']) $(id).disabled = true;

    const total = groups.reduce((s, g) => s + g.files.reduce((t, f) => t + f.size, 0), 0);
    let done = 0;
    let added = 0;
    let wakeLock = null;
    const setProgress = (text) => {
        $('import-text').textContent = text;
        $('import-fill').style.width = (total ? (100 * done) / total : 0) + '%';
    };

    try {
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
        try { wakeLock = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch (e) { /* optional */ }

        const root = await booksRoot();
        const lib = loadLibrary();

        for (const g of groups) {
            const id = hashId(g.title);
            const dir = await root.getDirectoryHandle(id, { create: true });
            const chapters = [];
            for (let i = 0; i < g.files.length; i++) {
                const f = g.files[i];
                const name = 'c' + String(i + 1).padStart(4, '0') + '.mp3';
                setProgress(`Copying "${g.title}" (${i + 1} of ${g.files.length})`);
                let have = false;
                try {                                   // already copied earlier (same size)? skip it
                    have = (await (await dir.getFileHandle(name)).getFile()).size === f.size;
                } catch (e) { /* not there yet */ }
                if (have) done += f.size;
                else await copyFile(dir, name, f, (n) => { done += n; setProgress(`Copying "${g.title}" (${i + 1} of ${g.files.length})`); });
                chapters.push({ file: name, name: prettyName(f.name), size: f.size });
            }
            // remove leftovers from an older version of this book
            try {
                for await (const key of dir.keys()) {
                    if (!chapters.some((c) => c.file === key)) await dir.removeEntry(key);
                }
            } catch (e) { /* not essential */ }

            const entry = { id, title: g.title, chapters };
            const at = lib.books.findIndex((b) => b.id === id);
            if (at >= 0) lib.books[at] = entry; else lib.books.push(entry);
            saveLibrary(lib);                           // save after every book, so a failure keeps earlier ones
            added++;
        }
        result.textContent = added === 1 ? 'Finished. 1 book added.' : `Finished. ${added} books added.`;
    } catch (err) {
        const full = err && (err.name === 'QuotaExceededError' || /quota/i.test(String(err && err.message)));
        result.textContent = (added ? `${added} added before a problem. ` : '') +
            (full ? 'The phone ran out of space. Free some space and try again.'
                  : 'Something went wrong while copying. Please try again.');
        result.classList.add('error');
    } finally {
        if (wakeLock) { try { await wakeLock.release(); } catch (e) { /* ignore */ } }
        importing = false;
        $('progress-panel').classList.add('hidden');
        $('import-fill').style.width = '0';
        for (const id of ['btn-pick-folder', 'btn-pick-files']) $(id).disabled = false;
        result.classList.remove('hidden');
        result.scrollIntoView({ block: 'nearest' });
        renderManage();
    }
}

function renderManage() {
    const lib = loadLibrary();
    const list = $('manage-list');
    list.textContent = '';
    $('manage-none').classList.toggle('hidden', lib.books.length > 0);

    for (const b of lib.books.slice().sort((x, y) => collator.compare(x.title, y.title))) {
        const li = el('li');
        const info = el('span', 'name', b.title);
        const size = b.chapters.reduce((s, c) => s + (c.size || 0), 0);
        info.append(el('span', 'meta', `${b.chapters.length} ${b.chapters.length === 1 ? 'chapter' : 'chapters'}, ${fmtBytes(size)}`));
        const rm = el('button', 'btn danger', 'Remove');
        let timer = null;
        rm.addEventListener('click', async () => {
            if (!rm.classList.contains('confirm')) {    // first tap asks, second tap removes
                rm.classList.add('confirm');
                rm.textContent = 'Tap again';
                timer = setTimeout(() => { rm.classList.remove('confirm'); rm.textContent = 'Remove'; }, 4000);
                return;
            }
            clearTimeout(timer);
            await removeBook(b.id);
            renderManage();
        });
        li.append(info, rm);
        list.appendChild(li);
    }

    $('version-info').textContent = `Version ${APP_VERSION}`;
    updateStorageInfo();
}

async function removeBook(id) {
    try {
        const root = await booksRoot();
        await root.removeEntry(id, { recursive: true });
    } catch (e) { /* folder may already be gone */ }
    const lib = loadLibrary();
    lib.books = lib.books.filter((b) => b.id !== id);
    saveLibrary(lib);
    try { localStorage.removeItem(PROGRESS_PREFIX + id); } catch (e) { /* ignore */ }
}

async function updateStorageInfo() {
    const out = $('storage-info');
    try {
        const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
        const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false;
        const parts = [];
        if (est && est.usage !== undefined) parts.push(`Books use ${fmtBytes(est.usage)}.`);
        if (est && est.quota) parts.push(`About ${fmtBytes(Math.max(0, est.quota - est.usage))} available.`);
        parts.push(persisted ? 'Storage is protected from automatic cleanup.'
                             : 'Storage is not yet protected from automatic cleanup. Installing the app to the home screen usually fixes this.');
        out.textContent = parts.join(' ');
    } catch (e) {
        out.textContent = '';
    }
}

/* =====================================================================
 * Start up
 * ===================================================================== */

(function init() {
    if (!navigator.storage || !navigator.storage.getDirectory) {
        document.body.textContent = 'This browser cannot store audiobooks. Please open the app in Chrome on Android.';
        return;
    }
    history.replaceState({ v: 'shelf' }, '');
    setupMediaSession();
    renderShelf();
    show('shelf');
    if (navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch((err) => console.log('Service worker not registered:', err));
    }
})();
