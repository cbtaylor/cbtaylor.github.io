# Easy Audiobook Player

A very simple audiobook player PWA for people with low vision (built for macular degeneration).
Plain HTML/CSS/JS, no libraries, no build step.

**Screens:** My Audiobooks (big buttons, last-played first) -> Player (one giant Play/Pause, Back 30 s,
Forward 30 s, My Books) -> a small "Add or remove books" screen for the helper.

## 1. Publish it

The folder is already inside the GitHub Pages repo (`cbtaylor.github.io`). Commit and push the
`easyreader` folder; the app will be at **https://cbtaylor.github.io/easyreader/** (HTTPS is required for a PWA).

## 2. Install it on Dorothy's phone (do this first)

1. Open Chrome on the phone and go to the address above.
2. Chrome menu (three dots) -> **Install app** (or **Add to Home screen**).
3. Open the app from the new home-screen icon.

Install **before** adding books: installed apps get protected storage, so Android won't clear the books to free space.

## 3. Add the books (helper does this once)

1. Put the MP3s on the phone, e.g. `Audiobooks/Book Name/01 Chapter.mp3 ...`
   - One subfolder per book; the MP3s inside are its chapters (sorted naturally: 2 before 10).
   - A single MP3 sitting loose in `Audiobooks` becomes a one-file book.
   - Don't use the phone's top-level **Download** folder itself as the chosen folder (Android blocks that); a subfolder of it is fine.
2. In the app: **Add audiobooks** (or *Add or remove books*) -> **Choose the Audiobooks folder** -> allow access -> check the preview -> **Add these**.
3. Keep the screen on until it says *Finished*. The files are **copied** into the app (so they take up space twice; the originals can be deleted afterwards).

To add a book later, repeat step 2. Re-adding an existing book skips files already copied.

## Using it

- Tap a book: it starts playing where she left off (backs up 5 seconds).
- **Play/Pause** is the big yellow button. **Back/Forward 30 seconds** cross chapter boundaries.
- **Next chapter** / **Previous chapter** (shown for books with more than one file). Previous restarts the chapter if you're more than 5 seconds in, otherwise it goes to the previous chapter (on chapter 1 it restarts). Repeated taps keep going.
- Chapters play one after another. At the end of the book it says "The End" and offers *Listen again*.
- The Android Back button (and **My Books**) pauses and returns to the list.
- Lock-screen and headphone buttons work (Media Session).

## If a book won't play

If the player says *"Part of this book is missing"* or *"could not be opened"*, open **Add or remove books**:
- **Last problem** shows the real cause (book, chapter, file, error).
- **Check all books** opens every chapter file and lists any that are missing or the wrong size.
- To repair, choose the same Audiobooks folder again (*Add these*): files that are already complete are skipped and the
  missing ones are copied again.
Meanwhile **Next chapter** skips past a chapter that won't open.

## Updating the app later

Push the changes to GitHub. The service worker is **network-first**: whenever the phone is online it fetches every app
file fresh, so the new version appears the **first** time the app is opened after GitHub Pages has published it
(usually a minute or two). Offline, or if the network takes more than 4 seconds, it uses the copy saved on the phone.
The version number shows at the bottom of *Add or remove books*. If you ever need to discard every saved copy, bump
`CACHE_VERSION` in `sw.js`.

(An earlier version served saved copies first and refreshed each file separately, which could briefly pair a new
`app.js` with an old `index.html` and break the app after an update. That's why it changed.)

## Not tested on real hardware

Tested in desktop Chromium with phone-size screens (import, playback, chapter changes, resume, offline, installability).
**Not** tested on an actual Android phone: the real folder-picker dialogs, TalkBack, lock-screen controls, and
playback with the screen off. Try these on the phone before relying on it. `<input webkitdirectory>` needs Chrome for
Android 132 or newer; if the folder button doesn't work, *Choose single MP3 files* is the fallback.

## Files

| File | Purpose |
|---|---|
| `index.html` | The three screens |
| `style.css` | Large, high-contrast styling (yellow on black) |
| `app.js` | Library import (OPFS), player, progress, Media Session |
| `sw.js` | Offline + update caching |
| `manifest.json`, `icon-*.png` | PWA install info and icons |
