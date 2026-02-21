import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Terminal from '@site/src/components/Terminal';
import FloatingGhosts from '@site/src/components/FloatingGhosts';
import NightSky from '@site/src/components/NightSky';

import styles from './index.module.css';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <NightSky />
      <FloatingGhosts />
      <main className={styles.main}>
        <Terminal />
      </main>
    </Layout>
  );
}
