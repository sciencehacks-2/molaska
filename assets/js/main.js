// main.js - Core logic for the Kali Web Desktop

class DesktopApp {
    constructor() {
        this.windows = [];
        this.emulator = null;
        this.term = null;
        this.editor = null;
        this.isSaving = false;

        // Initialize LightningFS
        if (window.LightningFS) {
            this.fs = new window.LightningFS('kali-fs');
            this.pfs = this.fs.promises;
        }

        this.git = window.git;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        if (this.pfs) {
            try {
                await this.pfs.mkdir('/workspace');
            } catch(e) {}
        }

        setTimeout(() => this.openApp('terminal'), 500);
        // Autosave every 5 minutes to avoid UI blocking
        setInterval(() => this.autoSave(), 300000);
    }

    setupEventListeners() {
        const startBtn = document.getElementById('start-menu-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('start-menu').classList.toggle('hidden');
            });
        }

        document.querySelectorAll('.app-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const app = e.currentTarget.getAttribute('data-app');
                this.openApp(app);
                document.getElementById('start-menu').classList.add('hidden');
            });
        });

        const saveBtn = document.getElementById('manual-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                saveBtn.textContent = '⏳ Saving...';
                this.autoSave().then(() => {
                    saveBtn.textContent = '💾 Save';
                    alert('VM State saved to browser storage!');
                });
            });
        }

        document.addEventListener('click', () => {
            const menu = document.getElementById('start-menu');
            if (menu) menu.classList.add('hidden');
        });
    }

    updateClock() {
        const clockEl = document.getElementById('clock');
        if (!clockEl) return;
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' +
                     now.getMinutes().toString().padStart(2, '0');
        clockEl.textContent = time;
    }

    focusWindow(win) {
        if (!win) return;
        this.windows.forEach(w => w.style.zIndex = 10);
        win.style.zIndex = 100;
    }

    openApp(appName) {
        let title, content;
        switch(appName) {
            case 'terminal':
                const existingTerm = this.getWindowByTitle('Terminal');
                if (existingTerm) {
                    this.focusWindow(existingTerm);
                    return;
                }
                title = 'Terminal';
                content = '<div class="terminal-container" id="terminal-target"></div>';
                break;
            case 'editor':
                const existingEditor = this.getWindowByTitle('VS Code (Web)');
                if (existingEditor) {
                    this.focusWindow(existingEditor);
                    return;
                }
                title = 'VS Code (Web)';
                content = '<div id="editor-container" style="width:100%; height:100%;"></div>';
                break;
            case 'sync':
                const existingSync = this.getWindowByTitle('GitHub Sync');
                if (existingSync) {
                    this.focusWindow(existingSync);
                    return;
                }
                title = 'GitHub Sync';
                content = `
                    <div style="padding:20px; color:#eee; background:#1e1e1e; height:100%; font-family:sans-serif;">
                        <h3 style="color:#004d99">☁️ GitHub Sync</h3>
                        <p style="font-size:11px; color:#888;">Uses <b>cors.isomorphic-git.org</b> proxy.</p>
                        <div style="margin-bottom:10px;">
                            <label>Token:</label>
                            <input type="password" id="gh-token" placeholder="GitHub PAT" style="width:100%; background:#222; color:#fff; border:1px solid #444;">
                        </div>
                        <div style="margin-bottom:10px;">
                            <label>Repo URL:</label>
                            <input type="text" id="gh-url" placeholder="https://github.com/user/repo" style="width:100%; background:#222; color:#fff; border:1px solid #444;">
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button id="btn-pull-real" style="flex:1; padding:8px; background:#004d99; border:none; color:white; cursor:pointer;">Pull/Clone</button>
                            <button id="btn-push-real" style="flex:1; padding:8px; background:#333; border:none; color:white; cursor:pointer;">Push</button>
                        </div>
                        <div id="sync-log-real" style="margin-top:15px; height:150px; overflow:auto; background:#000; color:#0f0; font-family:monospace; font-size:11px; padding:5px; border:1px solid #333;"></div>
                    </div>`;
                break;
            case 'browser':
                title = 'Web Browser';
                content = `
                    <div style="display:flex; flex-direction:column; height:100%;">
                        <div style="background:#222; padding:5px; display:flex; gap:5px;">
                            <input type="text" id="browser-url" value="https://www.bing.com" style="flex:1; background:#333; color:white; border:1px solid #444; padding:2px 10px; border-radius:15px;">
                            <button id="browser-go" style="background:#004d99; border:none; color:white; padding:2px 10px; border-radius:15px; cursor:pointer;">Go</button>
                        </div>
                        <div style="background:#f0ad4e; color:#000; font-size:10px; padding:2px 10px;">
                            ⚠️ Some sites block iframes (CORS). Try Bing or Wikipedia.
                        </div>
                        <iframe id="browser-iframe" src="https://www.bing.com" style="flex:1; border:none; background:white;"></iframe>
                    </div>`;
                break;
            case 'software':
                title = 'Software Center';
                content = `
                    <div style="padding:20px; color:#eee; background:#1e1e1e; height:100%; font-family:sans-serif; overflow:auto;">
                        <h3 style="color:#004d99">📦 Software Center</h3>
                        <p style="font-size:12px; color:#888;">Install tools directly into your Linux VM.</p>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            <div class="sw-card" style="background:#2a2a2a; padding:10px; border-radius:5px;">
                                <strong>Nmap</strong><br><small>Network Mapper</small><br>
                                <button onclick="window.app.installSoftware('nmap')" style="margin-top:5px; width:100%; background:#004d99; border:none; color:white; padding:5px; border-radius:3px; cursor:pointer;">Install</button>
                            </div>
                            <div class="sw-card" style="background:#2a2a2a; padding:10px; border-radius:5px;">
                                <strong>Python3</strong><br><small>Programming Language</small><br>
                                <button onclick="window.app.installSoftware('python3')" style="margin-top:5px; width:100%; background:#004d99; border:none; color:white; padding:5px; border-radius:3px; cursor:pointer;">Install</button>
                            </div>
                            <div class="sw-card" style="background:#2a2a2a; padding:10px; border-radius:5px;">
                                <strong>Metasploit</strong><br><small>Exploitation Framework</small><br>
                                <button onclick="window.app.installSoftware('metasploit-framework')" style="margin-top:5px; width:100%; background:#004d99; border:none; color:white; padding:5px; border-radius:3px; cursor:pointer;">Install</button>
                            </div>
                            <div class="sw-card" style="background:#2a2a2a; padding:10px; border-radius:5px;">
                                <strong>Git</strong><br><small>Version Control</small><br>
                                <button onclick="window.app.installSoftware('git')" style="margin-top:5px; width:100%; background:#004d99; border:none; color:white; padding:5px; border-radius:3px; cursor:pointer;">Install</button>
                            </div>
                        </div>
                    </div>`;
                break;
            default:
                return;
        }

        this.createWindow(title, content, appName);
    }

    getWindowByTitle(title) {
        return this.windows.find(w => w.querySelector('.window-title').textContent === title);
    }

    createWindow(title, content, appName) {
        const win = document.createElement('div');
        win.className = 'window';
        win.style.width = '800px';
        win.style.height = '500px';
        win.style.left = (100 + (this.windows.length * 30)) + 'px';
        win.style.top = (100 + (this.windows.length * 30)) + 'px';

        win.innerHTML = `
            <div class="window-header">
                <div class="window-title">${title}</div>
                <div class="window-controls">
                    <div class="control minimize"></div>
                    <div class="control maximize"></div>
                    <div class="control close" title="Close"></div>
                </div>
            </div>
            <div class="window-content">${content}</div>
        `;

        document.getElementById('windows-container').appendChild(win);
        this.windows.push(win);
        this.makeDraggable(win);
        this.focusWindow(win);

        win.querySelector('.close').onclick = (e) => {
            e.stopPropagation();
            win.remove();
            this.windows = this.windows.filter(w => w !== win);
        };

        if (appName === 'terminal') {
            setTimeout(() => this.initTerminal(), 100);
        } else if (appName === 'editor') {
            setTimeout(() => this.initEditor(), 100);
        } else if (appName === 'sync') {
            setTimeout(() => this.initSyncUI(win), 100);
        } else if (appName === 'browser') {
            setTimeout(() => this.initBrowserUI(win), 100);
        }
    }

    installSoftware(pkg) {
        if (!this.emulator) return alert('VM not running');
        this.openApp('terminal');
        setTimeout(() => {
            this.emulator.serial0_send(`sudo apt update && sudo apt install -y ${pkg}\n`);
        }, 500);
    }

    initBrowserUI(win) {
        const input = win.querySelector('#browser-url');
        const iframe = win.querySelector('#browser-iframe');
        const btn = win.querySelector('#browser-go');

        const navigate = () => {
            let url = input.value;
            if (!url.startsWith('http')) url = 'https://' + url;
            iframe.src = url;
        };

        btn.onclick = navigate;
        input.onkeypress = (e) => { if (e.key === 'Enter') navigate(); };
    }

    makeDraggable(win) {
        const header = win.querySelector('.window-header');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = (e) => {
            if (e.target.className.includes('control')) return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };
            document.onmousemove = (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                win.style.top = (win.offsetTop - pos2) + "px";
                win.style.left = (win.offsetLeft - pos1) + "px";
            };
        };

        win.onmousedown = () => {
            this.focusWindow(win);
        };
    }

    async initTerminal() {
        if (!window.Terminal) return;
        const term = new window.Terminal({
            theme: { background: '#0a0a0a', foreground: '#d2d2d2', cursor: '#00ff00' },
            fontFamily: '"Cascadia Code", monospace',
            cursorBlink: true
        });
        const terminalTarget = document.getElementById('terminal-target');
        if (!terminalTarget) return;

        if (window.FitAddon) {
            const fitAddon = new window.FitAddon.FitAddon();
            term.loadAddon(fitAddon);
            term.open(terminalTarget);
            fitAddon.fit();
        } else {
            term.open(terminalTarget);
        }
        this.term = term;

        if (!this.emulator) await this.startVM(term);
    }

    async initEditor() {
        if (typeof require === 'undefined') return;
        require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs' }});
        require(['vs/editor/editor.main'], async () => {
            this.editor = monaco.editor.create(document.getElementById('editor-container'), {
                value: '',
                language: 'python',
                theme: 'vs-dark',
                automaticLayout: true
            });

            if (this.pfs) {
                try {
                    const content = await this.pfs.readFile('/workspace/main.py', 'utf8');
                    this.editor.setValue(content);
                } catch(e) {
                    this.editor.setValue('# Kali Workspace\nprint("Hello Kali")');
                }

                this.editor.onDidChangeModelContent(async () => {
                    const val = this.editor.getValue();
                    await this.pfs.writeFile('/workspace/main.py', val);
                    // Sync to VM if running
                    this.syncFileToVM('main.py', val);
                });
            }
        });
    }

    syncFileToVM(filename, content) {
        if (this.emulator && this.emulator.create_file) {
            this.emulator.create_file('/' + filename, new TextEncoder().encode(content));
        }
    }

    initSyncUI(win) {
        const log = (msg) => {
            const el = win.querySelector('#sync-log-real');
            if (el) {
                el.innerHTML += `<div>> ${msg}</div>`;
                el.scrollTop = el.scrollHeight;
            }
        };

        win.querySelector('#btn-pull-real').onclick = async () => {
            const url = win.querySelector('#gh-url').value;
            const token = win.querySelector('#gh-token').value;
            if (!url) return log('Error: Repo URL required');

            log('Initializing Git pull...');
            try {
                await git.clone({
                    fs: this.fs,
                    http: window.GitHttp,
                    corsProxy: 'https://cors.isomorphic-git.org',
                    dir: '/workspace',
                    url: url,
                    onAuth: () => ({ username: token }),
                    singleBranch: true,
                    depth: 1
                });
                log('Successfully cloned to /workspace');
                // Refresh editor
                if (this.editor) {
                    const content = await this.pfs.readFile('/workspace/main.py', 'utf8');
                    this.editor.setValue(content);
                }
            } catch (e) {
                log('Git Error: ' + e.message);
                if (e.message.includes('already exists')) {
                    log('Directory already exists, attempting pull...');
                    // Add pull logic if needed
                }
            }
        };

        win.querySelector('#btn-push-real').onclick = async () => {
            const token = win.querySelector('#gh-token').value;
            log('Preparing to push...');
            try {
                await git.add({ fs: this.fs, dir: '/workspace', filepath: 'main.py' });
                await git.commit({
                    fs: this.fs,
                    dir: '/workspace',
                    author: { name: 'Kali User', email: 'kali@web.desktop' },
                    message: 'Update from Kali Web Desktop'
                });
                log('Changes committed locally.');
                log('Pushing to remote via proxy...');
                await git.push({
                    fs: this.fs,
                    http: window.GitHttp,
                    corsProxy: 'https://cors.isomorphic-git.org',
                    dir: '/workspace',
                    onAuth: () => ({ username: token })
                });
                log('Push successful!');
            } catch (e) {
                log('Push Error: ' + e.message);
            }
        };
    }

    async startVM(term) {
        if (typeof V86Starter === 'undefined') return;
        term.writeln('Booting Kali-base...');

        let savedState = null;
        if (window.idbKeyval) savedState = await window.idbKeyval.get('v86-state');

        const config = {
            wasm_path: "https://copy.sh/v86/build/v86.wasm",
            memory_size: 256 * 1024 * 1024,
            vga_memory_size: 8 * 1024 * 1024,
            screen_container: null,
            bios: { url: "https://copy.sh/v86/bios/seabios.bin" },
            vga_bios: { url: "https://copy.sh/v86/bios/vgabios.bin" },
            bzimage: { url: "https://copy.sh/v86/images/linux4.bin" },
            initrd: { url: "https://copy.sh/v86/images/rootfs.cpio.gz" },
            autostart: true,
            // Use Debian rootfs (hosted on copy.sh) which includes apt
            filesystem: {
                baseurl: "https://copy.sh/v86/images/debian-9-rootfs/",
            }
        };

        if (savedState) {
            term.writeln('Restoring session...');
            config.initial_state = { buffer: savedState };
        }

        this.emulator = new V86Starter(config);
        this.emulator.add_listener("serial0-output-char", (char) => term.write(char));
        term.onData((data) => this.emulator.serial0_send(data));

        this.emulator.add_listener("emulator-ready", () => {
            term.writeln('\x1B[1;32mKali Ready. /mnt is synced with Editor.\x1B[0m');
            // Mount 9p
            setTimeout(() => {
                this.emulator.serial0_send("mount -t 9p hostshare /mnt\n");
            }, 5000);
        });
    }

    async autoSave() {
        if (!this.emulator || this.isSaving || !window.idbKeyval) return;
        this.isSaving = true;
        return new Promise((resolve) => {
            this.emulator.save_state(async (err, state) => {
                if (!err && state) {
                    await window.idbKeyval.set('v86-state', state);
                    console.log("State saved.");
                }
                this.isSaving = false;
                resolve();
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DesktopApp();
});
