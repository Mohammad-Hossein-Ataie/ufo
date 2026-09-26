import type { ReactNode } from "react";

function anchor(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

export function ContentPostBody({ body, tone = "retail" }: { body: string; tone?: "retail" | "wholesale" }) {
  const content: ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    content.push(<p key={`p-${content.length}`}>{paragraph.join(" ")}</p>);
    paragraph = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    content.push(<ul key={`ul-${content.length}`}>{bullets.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>);
    bullets = [];
  };
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); flushBullets(); continue; }
    if (line.startsWith("### ")) {
      flushParagraph(); flushBullets();
      const value = line.slice(4).trim();
      content.push(<h3 id={anchor(value)} key={`h3-${content.length}`}>{value}</h3>);
    } else if (line.startsWith("## ")) {
      flushParagraph(); flushBullets();
      const value = line.slice(3).trim();
      content.push(<h2 id={anchor(value)} key={`h2-${content.length}`}>{value}</h2>);
    } else if (/^[-*]\s+/.test(line)) {
      flushParagraph(); bullets.push(line.replace(/^[-*]\s+/, ""));
    } else { flushBullets(); paragraph.push(line); }
  }
  flushParagraph(); flushBullets();
  return <div className={`content-prose ${tone === "wholesale" ? "content-prose-wholesale" : ""}`}>{content}</div>;
}
