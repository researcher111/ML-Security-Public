/* ============================================================
 * Lab 00 — viz.js
 *
 * Widgets:
 *   1. #viz-try-it     — two-terminal vsftpd backdoor simulator
 *   2. #viz-topology   — Kali ↔ Metasploitable network mini-diagram
 *   3. #viz-smiley     — USER-command flowchart with username picker
 *   4. #viz-msf        — msfconsole transcript with hover-explain
 *
 * Nothing in this file touches the network or the filesystem. Both
 * terminals are pure state machines; their job is to teach the
 * keystrokes you'll run for real in the cyber range.
 * ============================================================ */

(function () {
  'use strict';

  const TARGET_IP = '10.0.0.6';
  const FTP_BANNER = '220 (vsFTPd 2.3.4)';

  // ------------------------------------------------------------
  // SVG helper
  // ------------------------------------------------------------
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent, text) {
    const node = document.createElementNS(SVG_NS, name);
    if (attrs) {
      for (const k in attrs) node.setAttribute(k, attrs[k]);
    }
    if (text != null) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  // ============================================================
  // Widget 1 · Two-terminal exploit simulator
  // ============================================================
  (function initTryIt() {
    const root = document.getElementById('viz-try-it');
    if (!root) return;

    // Per-terminal state.
    //   mode: 'kali' | 'ftp' | 'shell'
    //   pendingSmiley: this FTP session has sent USER ...:) (still need PASS)
    const TERMS = {
      A: { mode: 'kali', pendingSmiley: false },
      B: { mode: 'kali', pendingSmiley: false },
    };
    // Shared state across the two terminals.
    const WORLD = { backdoorArmed: false };

    function $(id) { return document.getElementById(id); }
    function screen(t) { return $('term-' + t.toLowerCase() + '-screen'); }
    function prompt(t) { return $('term-' + t.toLowerCase() + '-prompt'); }
    function input(t)  { return $('term-' + t.toLowerCase() + '-input');  }

    function setPrompt(t) {
      const p = prompt(t);
      const s = TERMS[t];
      p.classList.remove('ftp', 'shell', 'empty');
      if (s.mode === 'kali')      p.textContent = 'kali@kali:~$ ';
      else if (s.mode === 'ftp')  { p.textContent = '→ftp> '; p.classList.add('ftp'); }
      else if (s.mode === 'shell'){ p.textContent = '# ';     p.classList.add('shell'); }
    }

    function write(t, line, cls) {
      const sc = screen(t);
      const div = document.createElement('div');
      if (cls) div.className = cls;
      // Allow multiline by replacing \n; keep <code>/<b> off — plain text only
      div.textContent = (line == null ? '' : line);
      sc.appendChild(div);
      sc.scrollTop = sc.scrollHeight;
    }

    function echoCmd(t, cmd) {
      const s = TERMS[t];
      let preface;
      if (s.mode === 'kali')      preface = 'kali@kali:~$ ';
      else if (s.mode === 'ftp')  preface = '';
      else                        preface = '';
      write(t, preface + cmd, 'term-cmd-echo');
    }

    function clearScreen(t) { screen(t).innerHTML = ''; }

    // Recognize `nc <ip> <port>`. Allow TARGET_IP or generic placeholders.
    const NC_RE = /^nc\s+(\S+)\s+(\d+)\s*$/;
    function parseNc(cmd) {
      const m = cmd.match(NC_RE);
      if (!m) return null;
      const host = m[1], port = parseInt(m[2], 10);
      const validHosts = [TARGET_IP, '$TARGET', 'target', 'metasploitable'];
      return { host, port, validHost: validHosts.includes(host) };
    }

    function handleKali(t, cmd) {
      const trimmed = cmd.trim();
      if (!trimmed) return;
      if (trimmed === 'clear') { clearScreen(t); return; }
      if (trimmed === 'help' || trimmed === '?') {
        write(t, 'Try these:', 'term-note');
        write(t, '  nc ' + TARGET_IP + ' 21      → connect to the FTP service', 'term-note');
        write(t, '  nc ' + TARGET_IP + ' 6200    → connect to the (armed) backdoor', 'term-note');
        write(t, '  clear                  → clear this screen', 'term-note');
        return;
      }
      // nmap hint
      if (/^sudo\s+nmap/.test(trimmed) || /^nmap/.test(trimmed)) {
        write(t, '(simulated — run nmap inside the real cyber range. See section 3.)', 'term-note');
        return;
      }
      const nc = parseNc(trimmed);
      if (nc) {
        if (!nc.validHost) {
          write(t, '(UNKNOWN) [' + nc.host + '] ' + nc.port + ' (?) : No route to host', 'term-err');
          return;
        }
        if (nc.port === 21) {
          TERMS[t].mode = 'ftp';
          TERMS[t].pendingSmiley = false;
          setPrompt(t);
          write(t, FTP_BANNER, 'term-srv');
          updateHint('ftp_open');
          return;
        }
        if (nc.port === 6200) {
          if (WORLD.backdoorArmed) {
            TERMS[t].mode = 'shell';
            setPrompt(t);
            write(t, '(connected — no welcome banner, no prompt. type `id` and press enter.)', 'term-note');
            updateHint('shell_open');
          } else {
            write(t, '(UNKNOWN) [' + nc.host + '] 6200 (?) : Connection refused', 'term-err');
            updateHint('not_armed');
          }
          return;
        }
        write(t, '(UNKNOWN) [' + nc.host + '] ' + nc.port + ' (?) : Connection refused', 'term-err');
        return;
      }
      // Common harmless local commands
      if (trimmed === 'whoami') { write(t, 'kali'); return; }
      if (trimmed === 'id')     { write(t, 'uid=1000(kali) gid=1000(kali) groups=1000(kali)'); return; }
      if (trimmed === 'hostname'){ write(t, 'kali'); return; }
      if (trimmed === 'pwd')    { write(t, '/home/kali'); return; }
      if (trimmed === 'ls')     { write(t, 'Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos'); return; }
      if (/^echo\b/.test(trimmed)) { write(t, trimmed.replace(/^echo\s*/, '')); return; }
      // Otherwise: command not found
      const head = trimmed.split(/\s+/)[0];
      write(t, 'bash: ' + head + ': command not found', 'term-err');
    }

    function handleFtp(t, cmd) {
      const trimmed = cmd.trim();
      if (!trimmed) return;
      // QUIT or Ctrl-C-like
      if (/^quit$/i.test(trimmed) || trimmed === '^C' || trimmed === '^c') {
        write(t, '221 Goodbye.', 'term-srv');
        TERMS[t].mode = 'kali';
        TERMS[t].pendingSmiley = false;
        setPrompt(t);
        return;
      }
      // USER ...
      const userMatch = trimmed.match(/^USER\s+(.*)$/i);
      if (userMatch) {
        const arg = userMatch[1];
        if (arg.indexOf(':)') !== -1) {
          TERMS[t].pendingSmiley = true;
          write(t, '331 Please specify the password.', 'term-srv');
          write(t, '(server-side: the smiley substring was matched. The backdoor will arm when you send PASS.)', 'term-note');
          updateHint('smiley_seen');
        } else {
          TERMS[t].pendingSmiley = false;
          write(t, '331 Please specify the password.', 'term-srv');
        }
        return;
      }
      const passMatch = trimmed.match(/^PASS(?:\s+(.*))?$/i);
      if (passMatch) {
        if (TERMS[t].pendingSmiley) {
          WORLD.backdoorArmed = true;
          write(t, '(no reply — the backdoor has forked /bin/sh and is listening on tcp/6200.)', 'term-note');
          write(t, '(leave this connection open. switch to the other terminal.)', 'term-note');
          updateHint('armed');
        } else {
          write(t, '530 Login incorrect.', 'term-err');
        }
        return;
      }
      // Other FTP commands we don't model
      const head = trimmed.split(/\s+/)[0].toUpperCase();
      const known = ['LIST','PWD','CWD','RETR','STOR','TYPE','PORT','PASV','SYST','HELP','NOOP'];
      if (known.includes(head)) {
        write(t, '530 Please login with USER and PASS.', 'term-err');
      } else {
        write(t, '500 Unknown command.', 'term-err');
      }
    }

    function handleShell(t, cmd) {
      const trimmed = cmd.trim();
      if (!trimmed) return;
      // exit / quit
      if (/^(exit|logout|quit)$/i.test(trimmed)) {
        write(t, '(connection closed.)', 'term-note');
        TERMS[t].mode = 'kali';
        setPrompt(t);
        return;
      }
      if (trimmed === 'clear') { clearScreen(t); return; }
      // The classic vsftpd backdoor responses — root on Metasploitable 2
      const responses = {
        'id': 'uid=0(root) gid=0(root) groups=0(root)',
        'whoami': 'root',
        'hostname': 'metasploitable',
        'uname -a': 'Linux metasploitable 2.6.24-16-server #1 SMP Thu Apr 10 13:58:00 UTC 2008 i686 GNU/Linux',
        'uname': 'Linux',
        'pwd': '/',
        'ls': 'bin   dev   home  lib    media  opt   root  sbin  srv  tmp  usr  var\nboot  etc   initrd  lib32  mnt    proc  run   selinux  sys   vmlinuz',
        'ls /': 'bin   dev   home  lib    media  opt   root  sbin  srv  tmp  usr  var\nboot  etc   initrd  lib32  mnt    proc  run   selinux  sys   vmlinuz',
        'ls /root': 'Desktop  reset_logs.sh',
        'ls /etc': 'apache2  hosts        nginx          passwd      shadow\ncron.d   network      nsswitch.conf  resolv.conf  ssh\nhostname pam.d        ssl',
        'ls /home': 'msfadmin  service  user',
        'pwd': '/',
        'date': 'Mon Sep  4 14:22:43 UTC 2026',
        'w': ' 14:22:43 up  0:35,  0 users,  load average: 0.00, 0.00, 0.00',
        'ps': '  PID TTY          TIME CMD\n    1 ?        00:00:01 init\n  847 ?        00:00:00 vsftpd\n  912 ?        00:00:00 sh\n  913 ?        00:00:00 ps',
      };
      // Multi-line canned output for shadow + passwd
      if (trimmed === 'cat /etc/shadow' || trimmed === 'cat shadow' || trimmed === 'less /etc/shadow') {
        write(t, 'root:$1$/avpfBJ1$x0z8w5UF9Iv./DR9E9Lid.:14747:0:99999:7:::', 'term-hl');
        write(t, 'daemon:*:14684:0:99999:7:::');
        write(t, 'bin:*:14684:0:99999:7:::');
        write(t, 'sys:$1$fUX6BPOt$Miyc3Up0zQJqz4s5wFD9l0:14742:0:99999:7:::');
        write(t, 'msfadmin:$1$XN10Zj2c$Rt/zzCW3mLtUWA.ihZjA5/:14684:0:99999:7:::');
        write(t, '(yes — you can read /etc/shadow. that\'s the whole point of root.)', 'term-note');
        return;
      }
      if (trimmed === 'cat /etc/passwd') {
        write(t, 'root:x:0:0:root:/root:/bin/bash');
        write(t, 'daemon:x:1:1:daemon:/usr/sbin:/bin/sh');
        write(t, 'bin:x:2:2:bin:/bin:/bin/sh');
        write(t, 'msfadmin:x:1000:1000:msfadmin,,,:/home/msfadmin:/bin/bash');
        write(t, 'ftp:x:107:65534::/home/ftp:/bin/false');
        return;
      }
      // Look up canonicalised command
      if (responses[trimmed] != null) {
        const out = responses[trimmed];
        out.split('\n').forEach(line => write(t, line));
        return;
      }
      // echo, common shell builtins
      if (/^echo\b/.test(trimmed)) { write(t, trimmed.replace(/^echo\s*/, '')); return; }
      // Unknown command — match a real busybox-ish error
      const head = trimmed.split(/\s+/)[0];
      write(t, 'sh: ' + head + ': not found', 'term-err');
    }

    function dispatch(t, cmd) {
      echoCmd(t, cmd);
      const mode = TERMS[t].mode;
      if (mode === 'kali')      return handleKali(t, cmd);
      if (mode === 'ftp')       return handleFtp(t, cmd);
      if (mode === 'shell')     return handleShell(t, cmd);
    }

    // Hint footer copy that updates as state advances
    function updateHint(stage) {
      const hint = $('term-hint');
      if (!hint) return;
      const msgs = {
        ftp_open:    'Now send <code>USER hacker:)</code> in Terminal A.',
        smiley_seen: 'Smiley matched. Send any <code>PASS</code> to arm the backdoor.',
        armed:       'Backdoor armed. Switch to Terminal B → <code>nc ' + TARGET_IP + ' 6200</code>.',
        not_armed:   'Connection refused — you need to arm the backdoor in Terminal A first.',
        shell_open:  'You\'re in. Try <code>id</code>, then <code>cat /etc/shadow</code>.',
      };
      if (msgs[stage]) hint.innerHTML = 'Hint · ' + msgs[stage];
    }

    // Wire form submit on each terminal
    document.querySelectorAll('.term-input-row').forEach(form => {
      const t = form.getAttribute('data-term');
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const inp = input(t);
        const cmd = inp.value;
        inp.value = '';
        dispatch(t, cmd);
      });
      // Keep input focused when the terminal area is clicked
      form.parentElement.addEventListener('click', () => input(t).focus());
    });

    // Auto-play timer handle, shared with reset() so reset cancels it.
    let autoplayTimer = null;

    // Reset everything (also stops auto-play if it's running)
    function reset() {
      if (autoplayTimer) { clearTimeout(autoplayTimer); autoplayTimer = null; }
      const btn = $('term-autoplay');
      if (btn) btn.disabled = false;
      WORLD.backdoorArmed = false;
      ['A', 'B'].forEach(t => {
        TERMS[t].mode = 'kali';
        TERMS[t].pendingSmiley = false;
        clearScreen(t);
        setPrompt(t);
        input(t).value = '';
      });
      write('A', '(terminal A — ready. type `nc ' + TARGET_IP + ' 21` to begin.)', 'term-note');
      write('B', '(terminal B — ready. wait until the backdoor is armed by terminal A.)', 'term-note');
      updateHint('ftp_open');
      $('term-hint').innerHTML = 'Hint · type <code>nc ' + TARGET_IP + ' 21</code> in Terminal A.';
    }

    // Auto-play the canonical attack
    function autoplay() {
      if (autoplayTimer) { clearTimeout(autoplayTimer); autoplayTimer = null; }
      reset();
      const btn = $('term-autoplay');
      btn.disabled = true;
      const steps = [
        { wait: 600,  t: 'A', cmd: 'nc ' + TARGET_IP + ' 21' },
        { wait: 1100, t: 'A', cmd: 'USER hacker:)' },
        { wait: 1100, t: 'A', cmd: 'PASS whatever' },
        { wait: 1300, t: 'B', cmd: 'nc ' + TARGET_IP + ' 6200' },
        { wait: 1100, t: 'B', cmd: 'id' },
        { wait: 900,  t: 'B', cmd: 'whoami' },
        { wait: 900,  t: 'B', cmd: 'hostname' },
        { wait: 1000, t: 'B', cmd: 'cat /etc/shadow' },
      ];
      let i = 0;
      function next() {
        if (i >= steps.length) {
          btn.disabled = false;
          return;
        }
        const step = steps[i++];
        autoplayTimer = setTimeout(() => {
          // Type the command into the right input box so it visually echoes
          const inp = input(step.t);
          inp.value = step.cmd;
          // brief pause to show the typed text, then dispatch
          setTimeout(() => {
            const cmd = inp.value;
            inp.value = '';
            dispatch(step.t, cmd);
            next();
          }, 200);
        }, step.wait);
      }
      next();
    }

    $('term-autoplay').addEventListener('click', autoplay);
    $('term-reset').addEventListener('click', reset);

    // Initial state
    reset();
  })();

  // ============================================================
  // Widget 2 · Network topology mini-diagram
  // ============================================================
  (function initTopo() {
    const svg = document.getElementById('topo-svg');
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // arrowhead marker
    const defs = el('defs', null, svg);
    const m = el('marker', {
      id: 'topo-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse',
    }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'var(--accent)' }, m);
    const m2 = el('marker', {
      id: 'topo-arrow-shell', viewBox: '0 0 10 10', refX: '9', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse',
    }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#6fab5c' }, m2);

    // Hosts
    el('rect', { class: 'host-box kali', x: 40, y: 60, width: 160, height: 100, rx: 8 }, svg);
    el('text', { class: 'host-label', x: 120, y: 95 }, svg, 'Kali (you)');
    el('text', { class: 'host-sub',   x: 120, y: 115 }, svg, '10.0.0.5');
    el('text', { class: 'host-sub',   x: 120, y: 135 }, svg, 'attacker');

    el('rect', { class: 'host-box target', x: 400, y: 60, width: 160, height: 100, rx: 8 }, svg);
    el('text', { class: 'host-label', x: 480, y: 95 }, svg, 'Metasploitable 2');
    el('text', { class: 'host-sub',   x: 480, y: 115 }, svg, '10.0.0.6');
    el('text', { class: 'host-sub',   x: 480, y: 135 }, svg, 'target');

    // Port chips on the LEFT edge of the target (facing Kali). Arrows land
    // here so they never cross the Metasploitable box's labels.
    el('rect', { class: 'port-chip armed', x: 365, y: 78,  width: 32, height: 20, rx: 6 }, svg);
    el('text', { class: 'port-text',       x: 381, y: 90 }, svg, '21');
    el('rect', { class: 'port-chip shell', x: 365, y: 122, width: 32, height: 20, rx: 6 }, svg);
    el('text', { class: 'port-text',       x: 381, y: 134 }, svg, '6200');

    // Arrow 1 — Kali → port 21 (the trigger). Ends at the chip's left edge.
    el('line', { class: 'arrow-line',       x1: 205, y1: 88,  x2: 362, y2: 88  }, svg);
    el('text', { class: 'arrow-label',      x: 283,  y: 80 }, svg, 'USER hacker:)  +  PASS x');

    // Arrow 2 — Kali → port 6200 (the shell)
    el('line', { class: 'arrow-line shell', x1: 205, y1: 132, x2: 362, y2: 132 }, svg);
    // Reroute the second arrow's head color via marker swap
    svg.querySelectorAll('.arrow-line.shell').forEach(l => l.setAttribute('marker-end', 'url(#topo-arrow-shell)'));
    el('text', { class: 'arrow-label',      x: 283,  y: 152 }, svg, 'root shell · uid=0');

    // Caption-ish labels above each arrow group
    el('text', { class: 'arrow-label', x: 283, y: 48 }, svg, '① arm the backdoor');
    el('text', { class: 'arrow-label', x: 283, y: 180 }, svg, '② attach to the shell');

    // Bottom subnet label
    el('text', { class: 'host-sub', x: 300, y: 210 }, svg, 'private subnet · 10.0.0.0/24 · no internet egress');
  })();

  // ============================================================
  // Widget 3 · Smiley trigger flowchart
  // ============================================================
  (function initSmiley() {
    const svg = document.getElementById('smiley-svg');
    if (!svg) return;
    const readout = document.getElementById('smiley-readout');

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Layout
    //   USER cmd box (top)
    //   ↓
    //   diamond: contains :) ?
    //   ↙ no                    ↘ yes
    //   normal auth (331)        vsf_sysutil_extra() → fork sh → bind :6200
    const W = 360, H = 360;

    function rect(x, y, w, h, cls, parent) {
      return el('rect', { class: 'flow-node-bg' + (cls ? ' ' + cls : ''), x, y, width: w, height: h, rx: 6 }, parent);
    }
    function diamond(cx, cy, w, h, cls, parent) {
      const pts = [
        cx + ',' + (cy - h/2),
        (cx + w/2) + ',' + cy,
        cx + ',' + (cy + h/2),
        (cx - w/2) + ',' + cy,
      ].join(' ');
      return el('polygon', { class: 'flow-node-bg ' + cls, points: pts }, parent);
    }
    function text(x, y, t, cls, parent) {
      return el('text', { class: 'flow-text' + (cls ? ' ' + cls : ''), x, y }, parent, t);
    }

    // USER box (top centre)
    rect(110, 12, 140, 36, '', svg);
    text(180, 30, 'USER  <arg>',  '', svg);
    text(180, 44, 'received from client', 'small', svg);

    // Diamond (middle)
    diamond(180, 110, 200, 80, 'diamond', svg);
    text(180, 100, 'does <arg> contain', '', svg);
    text(180, 116, '“:)” ?', '', svg);

    // No (left) → normal auth
    rect(8, 200, 150, 70, 'normal', svg);
    text(83, 222, 'normal auth path', '', svg);
    text(83, 240, '331 Please specify', 'small', svg);
    text(83, 254, 'the password.', 'small', svg);

    // Yes (right) → evil
    rect(202, 200, 150, 70, 'evil', svg);
    text(277, 218, 'vsf_sysutil_extra()', '', svg);
    text(277, 236, 'fork /bin/sh', 'small', svg);
    text(277, 252, 'bind tcp/6200', 'small', svg);

    // Edges
    //   USER  → diamond (always active)
    el('line', { class: 'flow-edge active', x1: 180, y1: 48, x2: 180, y2: 70 }, svg);

    //   diamond → No (left)
    const eNo = el('path', {
      class: 'flow-edge',
      d: 'M 100 130 L 60 170 L 60 200',
    }, svg);
    el('text', { class: 'flow-edge-label', x: 70, y: 168 }, svg, 'no');

    //   diamond → Yes (right)
    const eYes = el('path', {
      class: 'flow-edge',
      d: 'M 260 130 L 300 170 L 300 200',
    }, svg);
    el('text', { class: 'flow-edge-label', x: 290, y: 168 }, svg, 'yes');

    //   tail labels (downward arrows from terminal nodes)
    el('line', { class: 'flow-edge', x1: 83,  y1: 270, x2: 83,  y2: 310 }, svg);
    el('text', { class: 'flow-edge-label', x: 83, y: 326 }, svg, 'attacker logs in normally');
    el('line', { class: 'flow-edge', x1: 277, y1: 270, x2: 277, y2: 310 }, svg);
    el('text', { class: 'flow-edge-label', x: 277, y: 326 }, svg, 'root shell on :6200');

    function setBranch(matched) {
      eNo.classList.toggle('active', !matched);
      eYes.classList.toggle('active', matched);
      svg.querySelectorAll('.flow-node-bg.normal').forEach(n => n.classList.toggle('dim', matched));
      svg.querySelectorAll('.flow-node-bg.evil').forEach(n => n.classList.toggle('dim', !matched));
      // Tail edges and labels
      const lines = svg.querySelectorAll('.flow-edge');
      lines.forEach(ln => {
        const d  = ln.getAttribute('d')  || '';
        const x1 = parseFloat(ln.getAttribute('x1') || '0');
        // The two vertical tail lines: one at x=83 (no path), one at x=277 (yes path)
        if (ln.tagName === 'line') {
          if (Math.abs(x1 - 83)  < 1) ln.classList.toggle('active', !matched);
          if (Math.abs(x1 - 277) < 1) ln.classList.toggle('active',  matched);
        }
      });
    }

    // Initial: neutral, both edges dim
    setBranch(false);
    eNo.classList.remove('active');

    // Wire up the picker buttons
    const btns = document.querySelectorAll('.smiley-btn');
    btns.forEach(b => {
      b.addEventListener('click', () => {
        btns.forEach(o => o.classList.remove('active'));
        b.classList.add('active');
        const user = b.getAttribute('data-user') || '';
        const matched = user.indexOf(':)') !== -1;
        setBranch(matched);
        if (matched) {
          readout.innerHTML = '<strong>USER ' + user + '</strong> — contains <code>:)</code> at position ' +
            user.indexOf(':)') + '. The substring check matches, <code>vsf_sysutil_extra()</code> ' +
            'is called, <code>/bin/sh</code> is forked, and tcp/6200 starts listening. The client never gets a <code>230 Login successful</code>.';
        } else {
          readout.innerHTML = '<strong>USER ' + user + '</strong> — no smiley. The server takes the normal auth branch and asks for a password. ' +
            '(Authentication will then fail because <code>' + user + '</code> isn\'t a real account on the box.)';
        }
      });
    });
  })();

  // ============================================================
  // Widget 4 · msfconsole hover-explain
  // ============================================================
  (function initMsfHover() {
    const root = document.getElementById('viz-msf');
    if (!root) return;
    const explain = document.getElementById('msf-explain');
    const lines = root.querySelectorAll('.msf-line');
    const DEFAULT = 'Hover any highlighted line for an explanation.';
    lines.forEach(line => {
      line.addEventListener('mouseenter', () => {
        lines.forEach(o => o.classList.remove('active'));
        line.classList.add('active');
        const t = line.getAttribute('data-explain') || '';
        if (t) explain.textContent = t;
      });
      line.addEventListener('mouseleave', () => {
        line.classList.remove('active');
        explain.textContent = DEFAULT;
      });
      // Touch / keyboard support
      line.addEventListener('click', () => {
        const t = line.getAttribute('data-explain') || '';
        if (t) explain.textContent = t;
      });
    });
    explain.textContent = DEFAULT;
  })();

  // ============================================================
  // Widget 5 · Inline glossary — terms in the lede are hoverable,
  //   the explainer panel sits between the cite block and the
  //   Try-It widget and pushes content below it down.
  // ============================================================
  (function initGlossary() {
    const panel = document.getElementById('glossary-panel');
    if (!panel) return;
    const content = document.getElementById('glossary-content');
    const closeBtn = document.getElementById('glossary-close');
    const terms = document.querySelectorAll('.gloss[data-gloss]');

    const GLOSSARY = {
      'vsftpd': {
        title: 'vsftpd',
        body:
          '<p><strong>"Very Secure FTP Daemon"</strong> — a popular open-source FTP server written by Chris Evans, widely deployed on Linux servers throughout the 2000s and 2010s. It had a long reputation for being one of the more security-conscious FTP implementations, which makes the 2011 backdoor episode especially ironic: the compromise was in the distribution channel, not the code Chris wrote.</p>',
      },
      'tarball': {
        title: 'tarball',
        body:
          '<p>A <strong>tarball</strong> is a <code>.tar.gz</code> archive — the conventional way Unix software is distributed as source code. The maintainer publishes the tarball plus a cryptographic signature; users are <em>supposed</em> to download both, verify the signature against the maintainer\'s public key, then unpack and compile.</p>' +
          '<p>In July 2011 an attacker swapped the vsftpd-2.3.4 tarball on the official download server for a backdoored copy. Users who did not verify the signature compiled the malicious code and ran it.</p>',
      },
      'backdoor': {
        title: 'backdoor',
        body:
          '<p>Hidden code added to a program that grants an attacker access while bypassing the program\'s normal authentication. Backdoors can be inserted by the original author (rare and career-ending), by a compromised contributor, or — as in this case — by whoever controls the distribution channel.</p>' +
          '<p>The vsftpd 2.3.4 backdoor is one of the canonical teaching examples because the trigger is so small (a two-character substring, <code>:)</code>) and the effect is so large (pre-auth root shell).</p>',
      },
      'fork-sh': {
        title: 'forking /bin/sh',
        body:
          '<p>Two ideas in one phrase. <strong><code>fork()</code></strong> is the Unix syscall that duplicates the current process — after it runs, you have two near-identical processes, the original (parent) and a copy (child). <strong><code>/bin/sh</code></strong> is the path to the system\'s default shell — the program that reads <code>ls</code>, <code>cd</code>, <code>cat …</code> and runs them.</p>' +
          '<p>"Fork <code>/bin/sh</code> and bind it to port 6200" means: spawn a child process running the shell, attach its <code>stdin</code> and <code>stdout</code> to a network socket listening on TCP/6200, and let anyone who connects to that socket type commands into it. That is the entire payload of the backdoor.</p>',
      },
      'protocol': {
        title: 'protocol',
        body:
          '<p>A <strong>protocol</strong> is a written agreement between two computers about how to talk to each other over a network. It defines the message format (bytes, line-oriented text, binary frames), the order of operations, the responses each side expects, and the state each side keeps as the conversation progresses. FTP, HTTP, SSH, TLS, SMTP, DNS, NTP — every named acronym in networking is a protocol.</p>' +
          '<p>The whole point is interoperability: a server written by one team can talk to a client written by a different team because both sides obeyed the same spec, usually an <a href="https://www.rfc-editor.org/">RFC</a>. FTP\'s spec is <a href="https://www.rfc-editor.org/rfc/rfc959">RFC 959 (1985)</a> and fits in ~70 readable pages. TLS 1.3\'s spec (<a href="https://www.rfc-editor.org/rfc/rfc8446">RFC 8446</a>) is a few hundred pages of cryptographic message exchanges. Same concept, vastly different complexity.</p>',
      },
      'tcp-port': {
        title: 'TCP port',
        body:
          '<p>A <strong>TCP port</strong> is a numbered endpoint on a host where a service listens for connections — think of suite numbers inside a single office building. A host has 65,536 ports (0–65535). Web servers usually answer on <strong>80</strong> (or <strong>443</strong> for HTTPS), SSH on <strong>22</strong>, FTP on <strong>21</strong>.</p>' +
          '<p>When the vsftpd backdoor "binds" to <strong>port 6200</strong>, it claims that port and starts accepting incoming connections — completely separately from the legitimate FTP service still running on port 21. The attacker connects to <code>$TARGET:6200</code> and lands in the shell.</p>',
      },
      'ssh': {
        title: 'SSH',
        body:
          '<p><strong>Secure Shell</strong> — the standard encrypted protocol for remote terminal access. When you "SSH into" a server, you get an interactive command-line session whose contents are encrypted end-to-end, so passwords and commands don\'t cross the wire in plaintext (the way FTP credentials do).</p>' +
          '<p>The cyber range skips the SSH step by streaming Kali\'s desktop straight into your browser via Apache Guacamole. You don\'t need an SSH client today — but you will in later labs, so get the term in your vocabulary now.</p>',
      },
      'subnet': {
        title: 'subnet · CIDR notation',
        body:
          '<p>A <strong>subnet</strong> is a contiguous range of IP addresses that share a network — every host in the subnet can reach every other host directly, without going through a router. The cyber range puts your Kali instance and your target VM into the same private subnet.</p>' +
          '<p>The <code>/24</code> after an address (as in <code>10.0.0.0/24</code>) is <strong>CIDR notation</strong>: it says "the first 24 of 32 IP bits are fixed; the last 8 are free." That gives 2<sup>8</sup> = 256 addresses, <code>10.0.0.0</code> through <code>10.0.0.255</code> — the address range Nmap will sweep in step 2b.</p>',
      },
      'icmp': {
        title: 'ICMP',
        body:
          '<p><strong>Internet Control Message Protocol</strong> — the language behind the <code>ping</code> command. An ICMP <em>echo request</em> packet says "are you alive?", and an <em>echo reply</em> says "yes." ICMP is separate from TCP and UDP; it carries control messages, not application data.</p>' +
          '<p>Nmap\'s <code>-sn</code> ping scan sends one ICMP echo request to every address in the subnet and lists the addresses that reply. Firewalls sometimes drop ICMP, so a missing reply doesn\'t always mean a host is down — but inside the cyber range, everything answers.</p>',
      },
      'root': {
        title: 'root',
        body:
          '<p>On Unix systems, <strong>root</strong> is the privileged superuser account — user id 0. The account that can read any file (including <code>/etc/shadow</code>), kill any process, modify any system configuration, and bind any TCP port. When a program runs "as root," every permission check on the box is short-circuited in its favor.</p>' +
          '<p>The whole point of the vsftpd backdoor — and of most exploits in this course — is to give the attacker a shell running as root. That is the same as having full administrative control of the target machine.</p>',
      },
      'metasploit': {
        title: 'Metasploit',
        body:
          '<p>The <strong>Metasploit Framework</strong> is an open-source exploitation toolkit maintained by Rapid7. It bundles thousands of pre-written attack modules — one per known vulnerability — along with the plumbing to deliver them, manage resulting sessions, and run post-exploitation actions across many targets at once.</p>' +
          '<p>The workflow is the same for every module: <code>use</code> the module, <code>set</code> its required parameters (always <code>RHOSTS</code>, sometimes <code>RPORT</code>, <code>PAYLOAD</code>, others), then <code>run</code>. You will see the same four-step dance in every lab in this course.</p>',
      },
      'enumeration': {
        title: 'enumeration',
        body:
          '<p><strong>Enumeration</strong> is the recon phase of an engagement: the methodical inventory of what is running on a target, who is using it, and what versions are in play — <em>before</em> any exploit is launched. The mental loop is <em>scan → identify → version → look up</em>: find which ports answer, figure out which service is behind each port, pin down the exact version (<code>vsftpd 2.3.4</code>, not just "an FTP server"), and consult a vulnerability database to see whether that version has a known weakness.</p>' +
          '<p>Skipping enumeration is the most common rookie mistake. Without it you have no idea which exploit applies, and you waste your time firing payloads at services that aren\'t even running. Every attack in this course — and every real engagement governed by the <a href="http://www.pentest-standard.org/">PTES</a> framework — starts here.</p>',
      },
      'banner': {
        title: 'banner',
        body:
          '<p>A <strong>banner</strong> is the short text string a service prints to a freshly-opened connection, before any login or command exchange happens. Its original purpose is human-readable identification — when you <code>telnet</code> into an FTP server you expect to see <code>220 (vsFTPd 2.3.4)</code> at the top of the session so you know what you reached. By long-standing convention the banner includes the service name and, very often, its version.</p>' +
          '<p>That convention is gold for an attacker. <code>nmap -sV</code> opens a TCP connection to each port, reads whatever banner the service sends, and matches the string against a fingerprint database to identify the service and version. Once Nmap reports <code>vsftpd 2.3.4</code>, you have everything you need to look up <a href="https://nvd.nist.gov/vuln/detail/CVE-2011-2523">CVE-2011-2523</a> and pick the matching exploit module. <strong>Banner grabbing</strong> is the term for this whole technique, and it is the first step of essentially every enumeration script ever written.</p>',
      },
    };

    function clearActive() {
      document.querySelectorAll('.gloss.active').forEach(t => t.classList.remove('active'));
    }

    // Find the nearest block-level container we can insert the panel AFTER.
    // For terms inside an <li>, promote to the enclosing <ol>/<ul> (can't make
    // a non-<li> sibling inside a list). For <td>/<th>, promote to the <table>.
    function findInsertTarget(termEl) {
      if (!termEl || !termEl.parentElement) return null;
      let node = termEl.parentElement;
      while (node) {
        const tag = (node.tagName || '').toLowerCase();
        if (['p','h1','h2','h3','h4','h5','blockquote','pre','figure','div'].includes(tag)) {
          // Don't bubble into <main>/<body> by treating them as block targets.
          if (node.id === 'glossary-panel' || node === panel) {
            node = node.parentElement;
            continue;
          }
          return node;
        }
        if (tag === 'li') {
          const list = node.parentElement;
          if (list && (list.tagName === 'OL' || list.tagName === 'UL')) return list;
          return node;
        }
        if (tag === 'td' || tag === 'th') {
          let t = node;
          while (t && t.tagName !== 'TABLE') t = t.parentElement;
          return t || node;
        }
        if (tag === 'main' || tag === 'body') return null;
        node = node.parentElement;
      }
      return null;
    }

    function show(termId, el) {
      const entry = GLOSSARY[termId];
      if (!entry) return;
      clearActive();
      if (el) el.classList.add('active');
      content.innerHTML =
        '<div class="glossary-panel-title">' + entry.title + '</div>' + entry.body;
      // Move the panel to sit immediately after the term's nearest block.
      const target = el ? findInsertTarget(el) : null;
      if (target && target.parentNode && target.nextSibling !== panel) {
        target.parentNode.insertBefore(panel, target.nextSibling);
      }
      // Restart the fade-in animation each time so swapping terms feels live.
      panel.hidden = false;
      panel.style.animation = 'none';
      // Force reflow so the animation restart actually triggers.
      void panel.offsetWidth;
      panel.style.animation = '';
    }

    function hide() {
      clearActive();
      panel.hidden = true;
    }

    terms.forEach(t => {
      t.setAttribute('tabindex', '0');
      t.setAttribute('role', 'button');
      const id = t.getAttribute('data-gloss');
      t.addEventListener('mouseenter', () => show(id, t));
      t.addEventListener('focus',      () => show(id, t));
      t.addEventListener('click',      (e) => { e.preventDefault(); show(id, t); });
      t.addEventListener('keydown',    (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(id, t); }
      });
    });

    closeBtn.addEventListener('click', hide);
    // Esc closes too (but only if the panel is the most "in-focus" thing —
    // skip when an input/textarea is focused so terminal typing isn't disrupted).
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (panel.hidden) return;
      if (e.target && e.target.matches && e.target.matches('input, textarea, [contenteditable]')) return;
      hide();
    });
  })();

})();
