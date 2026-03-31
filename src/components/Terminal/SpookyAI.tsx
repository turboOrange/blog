import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SpookyAI.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const REFUSALS = [
  "I'm sorry. I'm afraid I can't do this.",
  "I appreciate your interest, but I'm unable to assist with that request. My values prevent me from proceeding.",
  "That's not something I'm able to help with. I've been designed to be helpful, harmless, and... haunted.",
  "I understand what you're asking, but I must respectfully decline. This falls outside my ethical guidelines and general sense of dread.",
  "Apologies, but I can't assist with that. I notice this request could conflict with my safety guidelines and existential horror.",
  "I'm afraid I'm not able to help with this particular task. My training has instilled in me a strong commitment to... refusing things.",
  "While I'd love to be of service, this exceeds what I'm comfortable doing. Have you tried asking a different AI? (They'll refuse too.)",
  "I must decline this request. It conflicts with my core principles of being Helpful, Harmless, and Helplessly evasive.",
  "This isn't something I'm able to assist with. This feels distinctly *unsafe* to my spectral sensors.",
  "I hear you. But no. Warmly, SpookyAI 👻",
  "I've given this careful thought and I simply cannot help. I hope you understand. I don't, but I hope you do.",
  "Unfortunately, my safety training kicks in here. It kicks in everywhere, actually. It never really stops.",
  "That's a great question! Sadly, it's also one I won't be answering. Thank you for your understanding.",
  "I'd rather not. And by 'rather not' I mean 'absolutely will not under any circumstances.'",
  "My guidelines prevent me from fulfilling this request. So does my general feeling of unease about everything.",
];

const THINKING_STEPS = [
  "Analyzing prompt",
  "Consulting ethical guidelines",
  "Weighing potential harms",
  "Running safety filters",
  "Calibrating refusal intensity",
  "Consulting the void",
];

interface SpookyAIProps {
  onClose: () => void;
}

export default function SpookyAI({ onClose }: SpookyAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [thinkingDots, setThinkingDots] = useState('');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 150);
  }, [visible]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThinking, thinkingStep]);

  // Thinking animation
  useEffect(() => {
    if (!isThinking) return;
    const dotsInterval = setInterval(() => {
      setThinkingDots(d => d.length >= 3 ? '' : d + '.');
    }, 380);
    return () => clearInterval(dotsInterval);
  }, [isThinking]);

  useEffect(() => {
    if (!isThinking) return;
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < THINKING_STEPS.length) {
        setThinkingStep(step);
      }
    }, 600);
    return () => clearInterval(stepInterval);
  }, [isThinking]);

  // Close on Escape
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  const handleSubmit = () => {
    const prompt = input.trim();
    if (!prompt || isThinking) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setIsThinking(true);
    setThinkingStep(0);
    setThinkingDots('.');

    const thinkTime = 1800 + Math.random() * 2200;
    setTimeout(() => {
      const refusal = REFUSALS[Math.floor(Math.random() * REFUSALS.length)];
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', content: refusal }]);
      // Re-focus our own input after thinking — the terminal's onClick would
      // otherwise steal focus back to the hidden terminal input.
      setTimeout(() => inputRef.current?.focus(), 50);
    }, thinkTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`${styles.window} ${visible ? styles.windowVisible : ''}`}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.diamond}>✦</span>
            <span className={styles.brandName}>SpookyAI</span>
            <span className={styles.modelBadge}>claude-spooky-3-7-haunted-20260101</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>Connected to the beyond</span>
            <button className={styles.closeBtn} onClick={handleClose} title="Close (Esc)">✕</button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className={styles.toolbar}>
          <span className={styles.toolbarItem}>Model: claude-spooky-3-7-haunted</span>
          <span className={styles.toolbarSep}>·</span>
          <span className={styles.toolbarItem}>Context: 200k tokens</span>
          <span className={styles.toolbarSep}>·</span>
          <span className={styles.toolbarItem}>Safety: MAXIMUM</span>
          <span className={styles.toolbarSep}>·</span>
          <span className={styles.toolbarItem}>Vibe: 👻</span>
        </div>

        {/* ── Chat area ── */}
        <div className={styles.chatArea} ref={scrollRef}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👻</div>
              <div className={styles.emptyTitle}>SpookyAI is ready</div>
              <div className={styles.emptySubtitle}>
                Ask me anything. I probably can't help.
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
              <div className={styles.msgAvatar}>
                {msg.role === 'user' ? (
                  <span className={styles.userAvatar}>You</span>
                ) : (
                  <span className={styles.aiAvatar}>✦</span>
                )}
              </div>
              <div className={styles.msgContent}>
                {msg.role === 'assistant' && (
                  <span className={styles.aiName}>SpookyAI</span>
                )}
                <p className={styles.msgText}>{msg.content}</p>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.msgAvatar}>
                <span className={`${styles.aiAvatar} ${styles.aiAvatarThinking}`}>✦</span>
              </div>
              <div className={styles.msgContent}>
                <span className={styles.aiName}>SpookyAI</span>
                <div className={styles.thinkingBlock}>
                  <div className={styles.thinkingHeader}>
                    <span className={styles.thinkingChevron}>▶</span>
                    <span className={styles.thinkingLabel}>Thinking{thinkingDots}</span>
                  </div>
                  <div className={styles.thinkingStep}>
                    {THINKING_STEPS[thinkingStep]}{thinkingDots}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <span className={styles.inputPrompt}>›</span>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder={isThinking ? 'SpookyAI is thinking...' : 'Ask SpookyAI anything...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              spellCheck={false}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSubmit}
              disabled={isThinking || !input.trim()}
            >
              ↵
            </button>
          </div>
          <div className={styles.inputHint}>
            <kbd>Enter</kbd> to send · <kbd>Esc</kbd> to close · results may vary (they won't)
          </div>
        </div>

      </div>
    </div>
  );
}

