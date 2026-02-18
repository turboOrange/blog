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

export default function Terminal() {
  const { siteConfig } = useDocusaurusContext();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [markdownContent, setMarkdownContent] = useState<Record<string, string>>({});
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load markdown content
  useEffect(() => {
    const loadMarkdown = async (name: string) => {
      try {
        const response = await fetch(`${siteConfig.baseUrl}content/${name}.md`);
        if (response.ok) {
          const text = await response.text();
          // Verify we didn't get the HTML 404 page
          if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
             throw new Error('Received HTML instead of Markdown');
          }
          setMarkdownContent(prev => ({ ...prev, [name]: text }));
        }
      } catch (error) {
        console.error(`Failed to load ${name}.md`, error);
      }
    };

    // Preload markdown files
    ['about', 'links', 'projects'].forEach(loadMarkdown);
  }, [siteConfig.baseUrl]);

  // ASCII Art for welcome banner
  const welcomeBanner = `
 █     █░▓█████  ██▓     ▄████▄   ▒█████   ███▄ ▄███▓▓█████
▓█░ █ ░█░▓█   ▀ ▓██▒    ▒██▀ ▀█  ▒██▒  ██▒▓██▒▀█▀ ██▒▓█   ▀
▒█░ █ ░█ ▒███   ▒██░    ▒▓█    ▄ ▒██░  ██▒▓██    ▓██░▒███
░█░ █ ░█ ▒▓█  ▄ ▒██░    ▒▓▓▄ ▄██▒▒██   ██░▒██    ▒██ ▒▓█  ▄
░░██▒██▓ ░▒████▒░██████▒▒ ▓███▀ ░░ ████▓▒░▒██▒   ░██▒░▒████▒
░ ▓░▒ ▒  ░░ ▒░ ░░ ▒░▓  ░░ ░▒ ▒  ░░ ▒░▒░▒░ ░ ▒░   ░  ░░░ ▒░ ░
  ▒ ░ ░   ░ ░  ░░ ░ ▒  ░  ░  ▒     ░ ▒ ▒░ ░  ░      ░ ░ ░  ░
  ░   ░     ░     ░ ░   ░        ░ ░ ░ ▒  ░      ░      ░
    ░       ░  ░    ░  ░░ ░          ░ ░         ░      ░  ░
                        ░
▄▄▄█████▓ ▒█████     ▄▄▄█████▓ ██░ ██ ▓█████
▓  ██▒ ▓▒▒██▒  ██▒   ▓  ██▒ ▓▒▓██░ ██▒▓█   ▀
▒ ▓██░ ▒░▒██░  ██▒   ▒ ▓██░ ▒░▒██▀▀██░▒███
░ ▓██▓ ░ ▒██   ██░   ░ ▓██▓ ░ ░▓█ ░██ ▒▓█  ▄
  ▒██▒ ░ ░ ████▓▒░     ▒██▒ ░ ░▓█▒░██▓░▒████▒
  ▒ ░░   ░ ▒░▒░▒░      ▒ ░░    ▒ ░░▒░▒░░ ▒░ ░
    ░      ░ ▒ ▒░        ░     ▒ ░▒░ ░ ░ ░  ░
  ░      ░ ░ ░ ▒       ░       ░  ░░ ░   ░
             ░ ░               ░  ░  ░   ░  ░

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

  // Define available commands
  const commands: Record<string, Command> = {
    menu: {
      name: 'menu',
      description: 'Show available commands',
      execute: () => {
        const commandList = Object.entries(commands)
          .map(([cmd, info]) => `- **${cmd}** - ${info.description}`)
          .join('\n');
        const menuContent = `# Available Commands

${commandList}`;
        return <MarkdownRenderer content={menuContent} />;
      },
    },
    about: {
      name: 'about',
      description: 'Show information about me',
      execute: () => {
        if (markdownContent.about) {
          return <MarkdownRenderer content={markdownContent.about} />;
        }
        // Fallback markdown content
        const fallbackContent = `# 👋 About Me

Hi! Welcome to my space!

## Background

I'm just a curious person that likes building things. I'm particularly interested in electronics and computing.

Following those interests I now have:
- An electronic repair DEP
- An electronics computers and networks DEC
- A computer science BAC

And I've been working as a software developer in test and QA for a while.
I just love building stuff.
In whatever I do you might find ints of my love for horror and retro computing.
`;
        return <MarkdownRenderer content={fallbackContent} />;
      },
    },
    links: {
      name: 'links',
      description: 'Show my favorite links',
      execute: () => {
        if (markdownContent.links) {
          return <MarkdownRenderer content={markdownContent.links} />;
        }
        // Fallback markdown content
        const fallbackContent = `# Favorite Links

## Funny git repos:
- [recall for linux](https://github.com/rolflobker/recall-for-linux)
- [the best programing language](https://github.com/TodePond/GulfOfMexico)
## Interesting historic repos:
- [Apollo 11's code](https://github.com/chrislgarry/Apollo-11)

`;
        return <MarkdownRenderer content={fallbackContent} />;
      },
    },
    projects: {
      name: 'projects',
      description: 'List my projects and their status',
      execute: () => {
        if (markdownContent.projects) {
          return <MarkdownRenderer content={markdownContent.projects} />;
        }
        // Fallback markdown content
        const fallbackContent = `# 💼 My Projects

## Active Projects

- [Personal Blog](https://github.com/turboOrange/blog) I use docusaurus (react based generator). My goal is to personalise it tot he maximum. Making it feel good and real.
- [spinashlang](https://github.com/spinachlang/spinachlang) A quantum language I made to simplify writing quantum code. It's advanced but not finished. I have some dream to attract contributors and build a community around it. I just suck at community building.

## Inactive Projects
- [readcode](https://github.com/turboOrange/readcode) A university group project to explore using AI to help learming how to read code.
- [pride ocarina](https://github.com/turboOrange/pride-ocarina) A project to make people learn to solder during pride month. It's unfinished cause the event never happened in the end.
`;
        return <MarkdownRenderer content={fallbackContent} />;
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
      execute: () => {
        const helpContent = `# 🤖 Terminal Help

- Type a command and press Enter
- Use ↑/↓ arrow keys to navigate history
- Type 'menu' to see all commands
- Type 'clear' to clear the screen`;
        return <MarkdownRenderer content={helpContent} />;
      },
    },
  };

  // Typing animation for initial message
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTo({
        top: terminalBodyRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [lines]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();

    // Add to history
    if (trimmedCmd) {
      setCommandHistory((prev) => [...prev, trimmedCmd]);
      setHistoryIndex(-1);
    }

    // Add command to output
    setLines((prev) => [
      ...prev,
      { type: 'command', content: `$ ${cmd}` },
    ]);

    if (!trimmedCmd) {
      return;
    }

    // Handle clear command specially
    if (trimmedCmd === 'clear') {
      setLines([]);
      return;
    }

    // Execute command
    if (commands[trimmedCmd]) {
      const output = commands[trimmedCmd].execute();
      if (output) {
        setLines((prev) => [...prev, { type: 'output', content: output }]);
      }
    } else {
      setLines((prev) => [
        ...prev,
        {
          type: 'output',
          content: (
            <div className={styles.error}>
              Command not found: {trimmedCmd}
              <br />
              Type 'menu' for available commands.
            </div>
          ),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
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
    <div className={styles.terminalContainer} onClick={() => inputRef.current?.focus()}>
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
          <div
            key={idx}
            className={`${styles.line} ${styles[line.type]}`}
          >
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
  );
}
