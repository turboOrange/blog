import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        components={{
          // Custom styling for markdown elements
          h1: ({ node, ...props }) => <h1 className={styles.h1} {...props} />,
          h2: ({ node, ...props }) => <h2 className={styles.h2} {...props} />,
          h3: ({ node, ...props }) => <h3 className={styles.h3} {...props} />,
          p: ({ node, ...props }) => <p className={styles.p} {...props} />,
          a: ({ node, ...props }) => <a className={styles.a} {...props} target="_blank" rel="noopener noreferrer" />,
          ul: ({ node, ...props }) => <ul className={styles.ul} {...props} />,
          ol: ({ node, ...props }) => <ol className={styles.ol} {...props} />,
          li: ({ node, ...props }) => <li className={styles.li} {...props} />,
          code: ({ node, inline, ...props }) =>
            inline ? <code className={styles.inlineCode} {...props} /> : <code className={styles.code} {...props} />,
          pre: ({ node, ...props }) => <pre className={styles.pre} {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className={styles.blockquote} {...props} />,
          hr: ({ node, ...props }) => <hr className={styles.hr} {...props} />,
          strong: ({ node, ...props }) => <strong className={styles.strong} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
