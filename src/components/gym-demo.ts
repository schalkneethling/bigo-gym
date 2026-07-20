import { LitElement, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { countOps, type RunnableExample } from "../content/runnable";
import { highlightCode } from "../lib/highlight";

let uidCounter = 0;

/**
 * Interactive "run it" panel for a refresher card: the pattern and its fix side
 * by side, an accessible range slider for the input size, and — on demand — a
 * live operation count for each so the O(n²) vs O(n) gap is visible, not just
 * asserted. Nothing runs until the reader presses "Run code"; a second button
 * highlights the offending lines in the pattern.
 */
@customElement("bigo-gym-demo")
export class BigoGymDemo extends LitElement {
  @property({ attribute: false }) example!: RunnableExample;
  @state() private n = -1;
  @state() private ran = false;
  @state() private showProblem = false;
  private readonly uid = `demo-${(uidCounter += 1)}`;

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.n < 0) this.n = this.example.defaultN;
  }

  private onInput(event: Event): void {
    this.n = Number((event.target as HTMLInputElement).value);
    // A new input size invalidates the last run's counts — make the reader
    // press "Run code" again so the numbers never lie about which n they are for.
    this.ran = false;
  }

  private onRun(): void {
    this.ran = true;
  }

  private toggleProblem(): void {
    this.showProblem = !this.showProblem;
  }

  /** Highlighted code, one wrapped line per source line so we can flag a range. */
  private renderCode(code: string, problemLines: readonly number[]): TemplateResult {
    const flagged = this.showProblem ? new Set(problemLines) : new Set<number>();
    const lines = code.split("\n").map((line, i) => {
      const cls = flagged.has(i + 1) ? "code-line code-line-flagged" : "code-line";
      return html`<span class=${cls}
        >${unsafeHTML(highlightCode(line || " ", "javascript"))}</span
      >`;
    });
    return html`<pre class="snippet"><code class="hljs language-javascript">${lines}</code></pre>`;
  }

  private codeBlock(label: string, code: string, problemLines: readonly number[]): TemplateResult {
    return html`
      <figure>
        <figcaption>${label}</figcaption>
        <!-- tabindex so keyboard users can scroll the code when it overflows -->
        <div class="snippet-scroll" tabindex="0" role="group" aria-label="${label} code">
          ${this.renderCode(code, problemLines)}
        </div>
      </figure>
    `;
  }

  protected override render(): TemplateResult {
    const { example } = this;
    const sliderId = `${this.uid}-n`;

    let results: TemplateResult | typeof nothing = nothing;
    if (this.ran) {
      const input = example.makeInput(this.n);
      const patternOps = countOps(example.problem, input);
      const fixedOps = countOps(example.fixed, input);
      const unitFor = (count: number): string =>
        count === 1 ? (example.unitOne ?? example.unit) : example.unit;
      results = html`
        <div class="demo-results" aria-live="polite">
          <dl>
            <div>
              <dt>The pattern</dt>
              <dd><strong>${patternOps.toLocaleString()}</strong> ${unitFor(patternOps)}</dd>
            </div>
            <div>
              <dt>After the fix</dt>
              <dd><strong>${fixedOps.toLocaleString()}</strong> ${unitFor(fixedOps)}</dd>
            </div>
          </dl>
          <p class="demo-note">${example.caption(this.n, patternOps, fixedOps)}</p>
        </div>
      `;
    }

    return html`
      <div class="demo">
        <div class="example-pair">
          ${this.codeBlock("The pattern", example.problem.code, example.problemLines)}
          ${this.codeBlock("After the fix", example.fixed.code, [])}
        </div>

        <div class="demo-controls">
          <label for=${sliderId}>Input size (n)</label>
          <input
            id=${sliderId}
            type="range"
            min=${example.minN}
            max=${example.maxN}
            step="1"
            .value=${String(this.n)}
            @input=${this.onInput}
          />
          <output for=${sliderId}>${this.n}</output>
        </div>

        <div class="demo-actions">
          <button type="button" class="primary" @click=${this.onRun}>Run code</button>
          <button
            type="button"
            class="demo-toggle"
            aria-pressed=${this.showProblem}
            @click=${this.toggleProblem}
          >
            ${this.showProblem ? "Clear highlight" : "Highlight problem code"}
          </button>
        </div>

        ${this.ran
          ? results
          : html`<p class="demo-hint">
              Pick an input size, then run the code to count the work at that size.
            </p>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "bigo-gym-demo": BigoGymDemo;
  }
}
