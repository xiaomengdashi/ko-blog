import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomeHero() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroInner}>
        <div className={styles.avatar}>K</div>
        <Heading as="h1" className={styles.title}>
          {siteConfig.title}
        </Heading>
        <p className={styles.subtitle}>{siteConfig.tagline}</p>
        <p className={styles.desc}>
          专注于 C++、系统编程与工程实践，持续记录高质量技术文章与学习笔记。
        </p>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to="/blog">
            浏览博客
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            阅读文档
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section className={styles.quickSection}>
      <div className={styles.grid}>
        <Link className={styles.card} to="/blog/tags/C++">
          <h3>C++ 专题</h3>
          <p>现代 C++、并发、模板与工程化实践。</p>
        </Link>
        <Link className={styles.card} to="/docs/intro">
          <h3>技术文档</h3>
          <p>体系化整理框架、算法与网络编程知识。</p>
        </Link>
        <a
          className={styles.card}
          href="https://github.com/xiaomengdashi/ko-blog"
          target="_blank"
          rel="noreferrer">
          <h3>GitHub</h3>
          <p>查看源码、文章原稿与项目更新。</p>
        </a>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className={styles.page}>
        <HomeHero />
        <QuickLinks />
      </main>
    </Layout>
  );
}
