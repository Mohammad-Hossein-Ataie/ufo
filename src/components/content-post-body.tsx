import Image from "next/image";
import type { ReactNode } from "react";
import { contentBodyToDocument, type RichTextInline } from "@/lib/content-rich-text";

function anchor(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function renderInlines(inlines: RichTextInline[], keyPrefix: string): ReactNode[] {
  return inlines.map((inline, index) => {
    let content: ReactNode = inline.text;
    if (inline.bold) content = <strong>{content}</strong>;
    if (inline.italic) content = <em>{content}</em>;
    if (inline.href) {
      const external = inline.href.startsWith("https://");
      content = (
        <a
          href={inline.href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {content}
        </a>
      );
    }
    return <span key={`${keyPrefix}-${index}`}>{content}</span>;
  });
}

export function ContentPostBody({
  body,
  tone = "retail",
}: {
  body: string;
  tone?: "retail" | "wholesale";
}) {
  const document = contentBodyToDocument(body);
  return (
    <div className={`content-prose ${tone === "wholesale" ? "content-prose-wholesale" : ""}`}>
      {document.blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === "image") {
          return (
            <figure key={key} className="content-prose-image">
              <Image
                src={block.src}
                alt={block.alt}
                width={block.width}
                height={block.height}
                unoptimized
                loading="lazy"
                sizes="(min-width: 1024px) 62rem, calc(100vw - 3rem)"
              />
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
        }
        if (block.type === "table") {
          const renderRow = (
            row: (typeof block.rows)[number],
            rowIndex: number,
            header = false,
          ) => (
            <tr key={`${key}-row-${rowIndex}`}>
              {row.map((cell, columnIndex) =>
                header ? (
                  <th key={columnIndex} scope="col">
                    {renderInlines(cell, `${key}-${rowIndex}-${columnIndex}`)}
                  </th>
                ) : (
                  <td key={columnIndex}>
                    {renderInlines(cell, `${key}-${rowIndex}-${columnIndex}`)}
                  </td>
                ),
              )}
            </tr>
          );
          return (
            <div
              key={key}
              className="content-prose-table"
              role="region"
              aria-label={block.caption || "جدول مقاله"}
              tabIndex={0}
            >
              <table>
                {block.caption ? <caption>{block.caption}</caption> : null}
                {block.headerRow && block.rows[0] ? (
                  <thead>{renderRow(block.rows[0], 0, true)}</thead>
                ) : null}
                <tbody>
                  {block.rows
                    .slice(block.headerRow ? 1 : 0)
                    .map((row, rowIndex) => renderRow(row, rowIndex + (block.headerRow ? 1 : 0)))}
                </tbody>
              </table>
            </div>
          );
        }
        if ("items" in block) {
          const items = block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{renderInlines(item, `${key}-${itemIndex}`)}</li>
          ));
          return block.type === "orderedList" ? (
            <ol key={key}>{items}</ol>
          ) : (
            <ul key={key}>{items}</ul>
          );
        }
        const inlines = renderInlines(block.content, key);
        const text = block.content.map((inline) => inline.text).join("");
        if (block.type === "heading2")
          return (
            <h2 id={anchor(text)} key={key}>
              {inlines}
            </h2>
          );
        if (block.type === "heading3")
          return (
            <h3 id={anchor(text)} key={key}>
              {inlines}
            </h3>
          );
        if (block.type === "quote") return <blockquote key={key}>{inlines}</blockquote>;
        return <p key={key}>{inlines}</p>;
      })}
    </div>
  );
}
