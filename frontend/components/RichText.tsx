import { Fragment } from 'react';

/** Render teks sederhana: paragraf, ## judul, - daftar, **tebal**. Aman tanpa dangerouslySetInnerHTML. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className="prose-me">
      {blocks.map((b, i) => {
        const lines = b.split('\n').filter((l) => l.trim());
        if (!lines.length) return null;
        if (lines[0].startsWith('### ')) return <h3 key={i}>{inline(lines[0].slice(4))}</h3>;
        if (lines[0].startsWith('## ')) return <h2 key={i}>{inline(lines[0].slice(3))}</h2>;
        if (lines.every((l) => /^[-*] /.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\. /, ''))}</li>)}</ol>;
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
