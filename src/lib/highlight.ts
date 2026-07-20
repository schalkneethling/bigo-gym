import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);

/** Returns highlighted HTML for a snippet. Safe for our own trusted content only. */
export function highlightCode(code: string, language: "typescript" | "javascript"): string {
  return hljs.highlight(code, { language }).value;
}
