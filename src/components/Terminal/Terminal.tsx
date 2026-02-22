import React, { useState, useEffect, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './Terminal.module.css';
import MarkdownRenderer from './MarkdownRenderer';

interface TerminalLine {
  type: 'command' | 'output' | 'system';
  content: React.ReactNode;
  timestamp?: string;
}

interface Command {
  name: string;
  description: string;
  execute: () => React.ReactNode;
}

// ─── Placeholder ASCII art – replace with your own ───────────────────────────
const BACK_ASCII_ART = `
ooodddddddddddddddddddddddddddddddddddddddddddddoooooooooooooollllllllccccc
ddddddddddddddddddddddddddddddddddddddddddddddddoooooooooooooooollllllllccc
dddddddddddddddddddddddxxddxdddddlc:;;;,,,,,,;:cloooooooooooooooollllllllcc
ddddddddddddddxxxxxxxxxxxxxxdlc;'...           ..';cloooooooooooooollllllll
dddddddddxxxxxxxxxxxxxxxddl:'.........             .'coooooooooooooolllllll
ddddddxxxxxxxxxxxxxxxxdoc,.........''''''''....      .;loodddooooooooolllll
dddddxxxxxxxxxxxxxxxxo:'......';cllooooooolllc:;,..  .':loooodddooooooollll
dxxxxxxxxxxxxxxxxxxdl,. ...';coodddddddddddddoollc:,...';cllooodoooooooolll
xxxxxxxxxxxxxxxxxxdc.. ...;loddxxxxxxxxxxdddddddoolc:,'.';:cloooddooooooool
xxxxxxxxxxxxkkkxxl,.  ..,codddxxxxxxxxxxxxxddddddoollc;,..,;cloodddoooooooo
xxxxxxxxxxxkkxxdc'.  .':loodddxxxxxxxxxxxxxxdddddoolllc:;'..,cooddddooooooo
xxxxxxxxkkxxxxo:'.. .'cloodddxxkkkkkkkkkkkkkkxxxxdooollcc:,..'coodddddooooo
xxxxxxxxxxkkxo:'..  .:lodddddddxxkkOOOOOOOOkkkxxxxxddollcc:'..,loddddddoooo
xxxxxxxxxxkxdc,..  .,cccc:;,,,,;:coxOOOOOOkxdol:;:cloollcc:,...;oddddddoooo
xxxxxxxxkxxdl;'.. ..,'.',;;;;,,;:codkkkOOkxdl:;'....'''';::;'. 'lddddddddoo
xxxxxxkkxxdo:'.......';lddxxxddddoddxxxkkxdoolllccllcc;'..,;'. .:ddddddddoo
xxxxxkkxxxo:,'.....';clc:::;;;clllllodxxxdlcclccc:cccllc;..,,. .;oddddddddo
xxxxxxxxxoc;'.....,:cc;';c:,';locc:cdxxxxoc::cll;..';,';::;;,. .:oddddddddd
xxxxxxxxdc;'......;loc::clolooollccoxkkxdoc::clolc::c:'';clc:. 'coddddddddd
xxxxxkxdl:'.......:ooooooddddddollokOOOOOdcclcloddollc::clll:'.,loddddddddd
xxxxxxxl:,.......'cddxxxxxxdddddddkO00000Odloooodddddooooolc:'.;odddddddddd
xxxxxxoc;'.......;odxxkkxxxxkkkxodkOKKKK0Oxlldxdddddxddddolc:,,codddddddddd
xxxxxdl:'........:dxxxxkxxkOO0Oxlc;lxkkxl;;clokkkxxxxxxxddoc:,:lddddddddddd
xxxxxdl;........'cddxxxxkkOO00kdol::loolc;;looxOOkkxxxxddool:,:oddddddddddd
xxxxxoc,........,lddxxxxkOOOOkkxdoodxxdxxddoodxkOOkkxxdddoll;,:oddddddddddd
xxxxdo;....... .,loddxxxkkOkkxxxxdxkkkkkkxxddxxxkkkkxxddoolc;,:oddddddddddo
xxxxdc,.....   .,coddxxxkkkxxxxkkkkOOOOOOkkxxxdxxxxxxdddolc:,,:oddddddddddo
xxxdo:'....    .,clodxxxxxxxxxxxddddxxxxxxxxxxxddxxxdddoolc;,,codddddddddoo
xxxdl;..........'cllodxxxxxdollllloooooollllloooodxxddollc:;,;codddddddddoo
xxdoc,...........;lllodxxxdddddxxxkxxxxxxxdddollloddddoccc:,,:loddddddddooo
xdol:;'...........:cllodddddxxxkkkkkkkxxxxxxxxxddddddolcc:;';coddddddddoooo
ooollc,'........  .:ccloooddxxxkkkkkkkkkkkkkxxxddoooolc::,',:loddddddddoooo
ooollc:,'.......   .;::clloodxkkkkkkOOOOkkkkxxddollcc::;,',:loddddddddooooo
ooollc:,......      .,;::cclodxxxkkOOOOOkkxxxdolcc:::;;'',:clodddddoooooooo
ooccc:;'.....        .',;;;:clodxxkkkkkkkkxdool:;;;;,'...,;cloddddooooooooo
ooc;;,'..           ....,,,',;cloddxxxxxxddlc;,',,,'...    ..':odoooooooooo
l:'...             ..'''',,;,,,,;::ccclcc:;,'',,,,.....       .';:looooooll
.                  .',,,,,,,;;;;;,,,,,,,,,,,,;,'''''''..          .';clllll
                   .',;;;;;;;;;;;::::::::;;,,,'',,,,,,.               .....
                    .,;;:;;;;;;;;;;;;;;,,,,,,,;;;;;,,.
                     .,::::::;;;;;;;;;;;;;;;;::::;;,.
                      .;:cclcc::::;;;;:::::cccc::,..
                       .;clllllllccccccccllllc:;'.
                         .';coooooooooooooolc,..
                            .';:::;;,,,,,,'..

`;
// ─────────────────────────────────────────────────────────────────────────────

const EDGE_ZONE = 60;      // px from left/right edge that starts a drag

export default function Terminal() {
  const { siteConfig } = useDocusaurusContext();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [markdownContent, setMarkdownContent] = useState<Record<string, string>>({});
  const [isFlipped, setIsFlipped] = useState(false);

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // All mutable interaction state in one ref — handlers registered once,
  // never capture stale React state.
  const iRef = useRef({
    flipped: false,
    dragging: false,
    dragSide: 'right' as 'left' | 'right',
    startX: 0,
    baseRotY: 0,   // actual rotation at the moment drag starts
  });

  const setTransform = (rotY: number, rotX = 0, scale = 1, transition = '') => {
    const el = innerRef.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.transform =
      `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale},${scale},${scale})`;
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onMouseMove = (e: MouseEvent) => {
      if (iRef.current.dragging) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = innerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxD = Math.max(rect.width, rect.height);
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (maxD / 2)));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (maxD / 2)));
        const base = iRef.current.baseRotY;
        setTransform(base + dx * 8, -dy * 8, 1.01);
      });
    };

    const onMouseLeave = () => {
      const base = iRef.current.baseRotY;
      setTransform(base, 0, 1, 'transform 0.5s ease');
      setTimeout(() => { if (innerRef.current) innerRef.current.style.transition = ''; }, 500);
    };

    const onWrapperMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const onEdge = x < EDGE_ZONE || x > rect.width - EDGE_ZONE;
      wrapper.style.cursor = onEdge ? 'ew-resize' : '';
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isLeft  = x < EDGE_ZONE;
      const isRight = x > rect.width - EDGE_ZONE;
      if (!isLeft && !isRight) return;
      iRef.current.dragging = true;
      iRef.current.dragSide = isLeft ? 'left' : 'right';
      iRef.current.startX   = e.clientX;
      // capture the settled rotation so drag continues from it
      iRef.current.baseRotY = iRef.current.flipped
        ? Math.round(iRef.current.baseRotY / 180) * 180
        : Math.round(iRef.current.baseRotY / 180) * 180;
      wrapper.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!iRef.current.dragging) return;
      const delta = e.clientX - iRef.current.startX;
      // "drag through": pulling right side rightward peels it away → negative rotY
      // pulling left side leftward also peels → positive rotY
      // so: right side drag maps delta → -delta rotation, left side → +delta rotation
      const rotDelta = iRef.current.dragSide === 'right' ? -delta : delta;
      const rotY = iRef.current.baseRotY + rotDelta * 0.5;
      setTransform(rotY, 0, 1.02);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!iRef.current.dragging) return;
      iRef.current.dragging = false;
      const delta = e.clientX - iRef.current.startX;
      const rotDelta = iRef.current.dragSide === 'right' ? -delta : delta;
      const currentRotY = iRef.current.baseRotY + rotDelta * 0.5;
      // Snap to nearest multiple of 180°
      const snapped = Math.round(currentRotY / 180) * 180;
      iRef.current.baseRotY = snapped;
      iRef.current.flipped = ((((snapped / 180) % 2) + 2) % 2) === 1;
      setTransform(snapped, 0, 1, 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)');
      setTimeout(() => { if (innerRef.current) innerRef.current.style.transition = ''; }, 410);
      setIsFlipped(iRef.current.flipped);
    };

    window.addEventListener('mousemove', onMouseMove);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    wrapper.addEventListener('mousemove', onWrapperMouseMove);
    wrapper.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      wrapper.removeEventListener('mousemove', onWrapperMouseMove);
      wrapper.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const loadMarkdown = async (name: string) => {
      try {
        const response = await fetch(`${siteConfig.baseUrl}content/${name}.md`);
        if (response.ok) {
          const text = await response.text();
          if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
            throw new Error('Received HTML instead of Markdown');
          }
          setMarkdownContent(prev => ({ ...prev, [name]: text }));
        }
      } catch (error) {
        console.error(`Failed to load ${name}.md`, error);
      }
    };
    ['about', 'links', 'projects'].forEach(loadMarkdown);
  }, [siteConfig.baseUrl]);

  const welcomeBanner = `
  ██████  ██▓███   ▒█████   ▒█████   ██ ▄█▀▓██   ██▓
▒██    ▒ ▓██░  ██▒▒██▒  ██▒▒██▒  ██▒ ██▄█▒  ▒██  ██▒
░ ▓██▄   ▓██░ ██▓▒▒██░  ██▒▒██░  ██▒▓███▄░   ▒██ ██░
  ▒   ██▒▒██▄█▓▒ ▒▒██   ██░▒██   ██░▓██ █▄   ░ ▐██▓░
▒██████▒▒▒██▒ ░  ░░ ████▓▒░░ ████▓▒░▒██▒ █▄  ░ ██▒▓░
▒ ▒▓▒ ▒ ░▒▓▒░ ░  ░░ ▒░▒░▒░ ░ ▒░▒░▒░ ▒ ▒▒ ▓▒   ██▒▒▒
░ ░▒  ░ ░░▒ ░       ░ ▒ ▒░   ░ ▒ ▒░ ░ ░▒ ▒░ ▓██ ░▒░
░  ░  ░  ░░       ░ ░ ░ ▒  ░ ░ ░ ▒  ░ ░░ ░  ▒ ▒ ░░
      ░               ░ ░      ░ ░  ░  ░    ░ ░
                                            ░ ░
▄▄▄█████▓▓█████  ██▀███   ███▄ ▄███▓ ██▓ ███▄    █  ▄▄▄       ██▓     ▐██▌
▓  ██▒ ▓▒▓█   ▀ ▓██ ▒ ██▒▓██▒▀█▀ ██▒▓██▒ ██ ▀█   █ ▒████▄    ▓██▒     ▐██▌
▒ ▓██░ ▒░▒███   ▓██ ░▄█ ▒▓██    ▓██░▒██▒▓██  ▀█ ██▒▒██  ▀█▄  ▒██░     ▐██▌
░ ▓██▓ ░ ▒▓█  ▄ ▒██▀▀█▄  ▒██    ▒██ ░██░▓██▒  ▐▌██▒░██▄▄▄▄██ ▒██░     ▓██▒
  ▒██▒ ░ ░▒████▒░██▓ ▒██▒▒██▒   ░██▒░██░▒██░   ▓██░ ▓█   ▓██▒░██████▒ ▒▄▄
  ▒ ░░   ░░ ▒░ ░░ ▒▓ ░▒▓░░ ▒░   ░  ░░▓  ░ ▒░   ▒ ▒  ▒▒   ▓▒█░░ ▒░▓  ░ ░▀▀▒
    ░     ░ ░  ░  ░▒ ░ ▒░░  ░      ░ ▒ ░░ ░░   ░ ▒░  ▒   ▒▒ ░░ ░ ▒  ░ ░  ░
  ░         ░     ░░   ░ ░      ░    ▒ ░   ░   ░ ░   ░   ▒     ░ ░       ░
            ░  ░   ░            ░    ░           ░       ░  ░    ░  ░ ░
`;

  const commands: Record<string, Command> = {
    menu: {
      name: 'menu',
      description: 'Show available commands',
      execute: () => {
        const commandList = Object.entries(commands)
          .map(([cmd, info]) => `- **${cmd}** - ${info.description}`)
          .join('\n');
        return <MarkdownRenderer content={`# Available Commands\n\n${commandList}`} />;
      },
    },
    about: {
      name: 'about',
      description: 'Show information about me',
      execute: () => {
        if (markdownContent.about) return <MarkdownRenderer content={markdownContent.about} />;
        return <MarkdownRenderer content={`# 👋 About Me\n\nHi! Welcome to my space!\n\n## Background\n\nI'm just a curious person that likes building things. I'm particularly interested in electronics and computing.\n\nFollowing those interests I now have:\n- An electronic repair DEP\n- An electronics computers and networks DEC\n- A computer science BAC\n\nAnd I've been working as a software developer in test and QA for a while.\nI just love building stuff.\nIn whatever I do you might find ints of my love for horror and retro computing.\n`} />;
      },
    },
    links: {
      name: 'links',
      description: 'Show my favorite links',
      execute: () => {
        if (markdownContent.links) return <MarkdownRenderer content={markdownContent.links} />;
        return <MarkdownRenderer content={`# Favorite Links\n\n## Funny git repos:\n- [recall for linux](https://github.com/rolflobker/recall-for-linux)\n- [the best programing language](https://github.com/TodePond/GulfOfMexico)\n## Interesting historic repos:\n- [Apollo 11's code](https://github.com/chrislgarry/Apollo-11)\n`} />;
      },
    },
    projects: {
      name: 'projects',
      description: 'List my projects and their status',
      execute: () => {
        if (markdownContent.projects) return <MarkdownRenderer content={markdownContent.projects} />;
        return <MarkdownRenderer content={`# 💼 My Projects\n\n## Active Projects\n\n- [Personal Blog](https://github.com/turboOrange/blog) I use docusaurus (react based generator). My goal is to personalise it to the maximum. Making it feel good and real.\n- [spinashlang](https://github.com/spinachlang/spinachlang) A quantum language I made to simplify writing quantum code. Advanced but not finished.\n\n## Inactive Projects\n- [readcode](https://github.com/turboOrange/readcode) A university group project to explore using AI to help learning how to read code.\n- [pride ocarina](https://github.com/turboOrange/pride-ocarina) A project to make people learn to solder during pride month.\n`} />;
      },
    },
    clear: {
      name: 'clear',
      description: 'Clear the terminal',
      execute: () => null,
    },
    help: {
      name: 'help',
      description: 'Show help information',
      execute: () => <MarkdownRenderer content={`# 🤖 Terminal Help\n\n- Type a command and press Enter\n- Use ↑/↓ arrow keys to navigate history\n- Type 'menu' to see all commands\n- Type 'clear' to clear the screen`} />,
    },
  };

  useEffect(() => {
    const initialMessages = [
      { type: 'system' as const, content: welcomeBanner, delay: 0 },
      { type: 'system' as const, content: '> Loading awesome content...', delay: 1000 },
      { type: 'system' as const, content: '> Ready! Type "menu" to see available commands.', delay: 1500 },
    ];
    initialMessages.forEach(({ type, content, delay }) => {
      setTimeout(() => {
        setLines((prev) => [...prev, { type, content }]);
        if (delay === 1500) {
          setIsTyping(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }, delay);
    });
  }, []);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTo({ top: terminalBodyRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [lines]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    if (trimmedCmd) {
      setCommandHistory((prev) => [...prev, trimmedCmd]);
      setHistoryIndex(-1);
    }
    setLines((prev) => [...prev, { type: 'command', content: `$ ${cmd}` }]);
    if (!trimmedCmd) return;
    if (trimmedCmd === 'clear') { setLines([]); return; }
    if (commands[trimmedCmd]) {
      const output = commands[trimmedCmd].execute();
      if (output) setLines((prev) => [...prev, { type: 'output', content: output }]);
    } else {
      setLines((prev) => [...prev, {
        type: 'output',
        content: (
          <div className={styles.error}>
            Command not found: {trimmedCmd}<br />Type 'menu' for available commands.
          </div>
        ),
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  return (
    <div ref={wrapperRef} className={styles.flipWrapper}>
      <div ref={innerRef} className={styles.flipInner}>

        {/* Single terminal — always rendered, drives the height */}
        <div className={styles.terminalContainer} onClick={() => !isFlipped && inputRef.current?.focus()}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalButtons}>
              <span className={styles.btnClose}></span>
              <span className={styles.btnMinimize}></span>
              <span className={styles.btnMaximize}></span>
            </div>
            <div className={styles.terminalTitle}>terminal@homepage ~ zsh</div>
          </div>
          <div className={styles.terminalBody} ref={terminalBodyRef}>
            {lines.map((line, idx) => (
              <div key={idx} className={`${styles.line} ${styles[line.type]}`}>
                {line.content}
              </div>
            ))}
            {!isTyping && (
              <div className={styles.inputLine}>
                <span className={styles.prompt}>$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={styles.input}
                  spellCheck={false}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        {/* BACK OVERLAY — absolutely covers the terminal, mirrored + frosted.
            rotateY(180deg) keeps it on the back face in 3-D space.
            backface-visibility: hidden hides it when the front is showing. */}
        <div className={styles.backOverlay} aria-hidden="true">
          {/* Frost sits directly on top; the terminal behind shows through */}
          <div className={styles.frostOverlay} />
          {/* ASCII art on top of the frost */}
          <div className={styles.backAsciiOverlay}>
            <pre className={styles.asciiBack}>{BACK_ASCII_ART}</pre>
          </div>
        </div>

      </div>
    </div>
  );
}
