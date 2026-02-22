// @ts-check
const fs = require('fs');
const path = require('path');

function fm(block, key) {
  const m = block.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return m ? m[1].trim() : '';
}

function parseTags(block) {
  const inline = block.match(/^tags:\s*\[(.+?)\]/m);
  if (inline) return inline[1].split(',').map(t => t.trim().replace(/^['"]|['"]$/g, ''));
  const list = block.match(/^tags:\s*\n((?:[ \t]*-[ \t]*.+\n?)+)/m);
  if (list) return list[1].split('\n').map(l => l.replace(/^[ \t]*-[ \t]*/, '').replace(/^['"]|['"]$/g, '').trim()).filter(Boolean);
  return [];
}

function toSlug(filePath, blogDir) {
  const rel = path.relative(blogDir, filePath).replace(/\.(mdx?)$/, '').replace(/\/index$/, '');
  const last = rel.split(path.sep).pop() ?? rel;
  return last.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function collectPosts(blogDir) {
  if (!fs.existsSync(blogDir)) return [];
  const posts = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(mdx?)$/.test(entry.name)) continue;

      const raw = fs.readFileSync(full, 'utf8');
      const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)/);
      const fmBlock = fmMatch?.[1] ?? '';
      const body = (fmMatch?.[2] ?? raw)
        .replace(/<!--\s*truncate\s*-->/g, '\n---\n')
        .replace(/<[^>]+>/g, '')
        .trim();

      const dateFromName =
        entry.name.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ??
        path.basename(dir).match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? '';

      posts.push({
        slug:        toSlug(full, blogDir),
        title:       fm(fmBlock, 'title') || toSlug(full, blogDir),
        date:        fm(fmBlock, 'date') || dateFromName,
        description: fm(fmBlock, 'description') || '',
        tags:        parseTags(fmBlock),
        content:     body,
      });
    }
  }

  walk(blogDir);
  return posts.sort((a, b) => (b.date > a.date ? 1 : -1));
}

/** @type {import('@docusaurus/types').PluginModule} */
module.exports = function blogGlobalDataPlugin(context) {
  return {
    name: 'blog-global-data',
    async loadContent() {
      return collectPosts(path.join(context.siteDir, 'blog'));
    },
    async contentLoaded({ content, actions }) {
      actions.setGlobalData({ posts: content });
    },
  };
};
