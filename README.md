# Kali Linux Web Desktop

A full-featured, serverless Kali Linux desktop environment that runs entirely in your web browser. This project uses x86 emulation (v86) to run a Linux kernel and rootfs client-side.

## Features

- **Full Desktop UI**: Taskbar, start menu, draggable windows, and system clock.
- **Linux VM**: Runs a Debian-based Linux environment with `apt` support.
- **Persistence**: Automatically saves VM state to your browser's IndexedDB. Manual save button included.
- **Integrated Code Editor**: VS Code-like experience using the Monaco Editor.
- **Workspace Sync**: Files edited in the browser are automatically synced to the `/mnt` directory in the Linux VM.
- **GitHub Integration**: Clone, pull, and push to GitHub repositories directly from the browser using Personal Access Tokens (PATs) and a CORS proxy.
- **Web Browser**: An internal browser to access web resources (limited by iframe security policies).
- **Software Center**: Easily install common security tools like Nmap, Python3, and Metasploit.

## How to Run the Project

Since this project uses ES modules and interacts with various web APIs, it **must** be served via an HTTP server. Opening the `index.html` file directly in your browser (`file://` protocol) will not work.

### Running in VS Code (Recommended)

1. **Install the "Live Server" Extension**:
   - Open VS Code.
   - Go to the Extensions view (click the square icon on the left or press `Ctrl+Shift+X`).
   - Search for **"Live Server"** (by Ritwick Dey) and click **Install**.

2. **Open the Project**:
   - Open the folder containing this project in VS Code.

3. **Start the Server**:
   - Right-click on `index.html` in the file explorer.
   - Select **"Open with Live Server"**.
   - Your default browser will open to `http://127.0.0.1:5500/index.html`.

### Running via Terminal (Alternative)

If you have Python installed, you can run a simple server from your terminal:

```bash
# Navigate to the project directory
cd path/to/kali-web-desktop

# Start the server
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Hosting

This project is entirely static and can be hosted for free on:
- **GitHub Pages**
- **Vercel / Netlify**
- **Google Drive** (using a web host service for Drive)

## Important Notes

- **Initial Load**: The first time you open the terminal, it will download the Linux kernel and rootfs (approx. 20-30MB).
- **CORS Proxy**: Git operations use `https://cors.isomorphic-git.org` to bypass browser security restrictions.
- **Iframe Restrictions**: Many websites (like Google) block being loaded in an iframe. Use compatible sites like Bing or Wikipedia for the internal browser.
