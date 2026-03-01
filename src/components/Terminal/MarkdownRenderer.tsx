import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
}

// Helper to extract text from React children
const extractText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (React.isValidElement(children) && children.props.children) {
    return extractText(children.props.children);
  }
  return '';
};

// Component to fade in text letter by letter
const FadeText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const text = extractText(children);

  return (
    <>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={styles.letterFade}
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  );
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        components={{
          // Custom styling for markdown elements with fade effect
          h1: ({ node, children, ...props }) => <h1 className={styles.h1} {...props}><FadeText>{children}</FadeText></h1>,
          h2: ({ node, children, ...props }) => <h2 className={styles.h2} {...props}><FadeText>{children}</FadeText></h2>,
          h3: ({ node, children, ...props }) => <h3 className={styles.h3} {...props}><FadeText>{children}</FadeText></h3>,
          p: ({ node, children, ...props }) => <p className={styles.p} {...props}><FadeText>{children}</FadeText></p>,
          a: ({ node, ...props }) => <a className={styles.a} {...props} target="_blank" rel="noopener noreferrer" />,
          ul: ({ node, ...props }) => <ul className={styles.ul} {...props} />,
          ol: ({ node, ...props }) => <ol className={styles.ol} {...props} />,
          li: ({ node, children, ...props }) => <li className={styles.li} {...props}><FadeText>{children}</FadeText></li>,
          code: ({ node, inline, ...props }) =>
            inline ? <code className={styles.inlineCode} {...props} /> : <code className={styles.code} {...props} />,
          pre: ({ node, ...props }) => <pre className={styles.pre} {...props} />,
          blockquote: ({ node, children, ...props }) => <blockquote className={styles.blockquote} {...props}><FadeText>{children}</FadeText></blockquote>,
          hr: ({ node, ...props }) => <hr className={styles.hr} {...props} />,
          strong: ({ node, children, ...props }) => <strong className={styles.strong} {...props}><FadeText>{children}</FadeText></strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
