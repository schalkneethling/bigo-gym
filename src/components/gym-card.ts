import { LitElement, html, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import {
  COMPLEXITY_CLASSES,
  SHAPES,
  shapeName,
  type ComplexityClass,
  type ShapeId,
} from "../catalogue";
import { SNIPPETS, type Snippet } from "../content/snippets";
import { gradeAttempt, type AttemptRecord } from "../lib/grading";
import { highlightCode } from "../lib/highlight";
import { pickNextSnippet } from "../lib/selection";
import { loadAttempts, saveAttempt } from "../lib/storage";

export const ATTEMPT_EVENT = "bigo-gym:attempt";

/**
 * The predict-then-reveal card. Renders in light DOM so the page's single
 * stylesheet (tokens, hljs colors, native form styling) applies directly.
 */
@customElement("bigo-gym-card")
export class BigoGymCard extends LitElement {
  @state() private snippet: Snippet;
  @state() private phase: "predict" | "reveal" = "predict";
  @state() private attempt: AttemptRecord | null = null;

  constructor() {
    super();
    this.snippet = pickNextSnippet(SNIPPETS, loadAttempts());
  }

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  private handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const complexity = data.get("complexity") as ComplexityClass | null;
    const shapeId = data.get("shape") as ShapeId | null;
    if (!complexity || !shapeId) return;

    const attempt = gradeAttempt(this.snippet, { complexity, shapeId });
    saveAttempt(attempt);
    this.attempt = attempt;
    this.phase = "reveal";
    window.dispatchEvent(new CustomEvent(ATTEMPT_EVENT, { detail: attempt }));
  }

  private nextSnippet(): void {
    this.snippet = pickNextSnippet(SNIPPETS, loadAttempts(), {
      excludeId: this.snippet.id,
    });
    this.attempt = null;
    this.phase = "predict";
  }

  private renderPredictForm(): TemplateResult {
    return html`
      <form class="predict-form" @submit=${this.handleSubmit}>
        <fieldset class="complexity-options">
          <legend>Time complexity</legend>
          ${COMPLEXITY_CLASSES.map(
            (complexity) => html`
              <label class="complexity-option">
                <input type="radio" name="complexity" value=${complexity} required />
                <span>${complexity}</span>
              </label>
            `,
          )}
        </fieldset>
        <div class="shape-field">
          <label for="shape-select">Which pattern is responsible?</label>
          <select id="shape-select" name="shape" required>
            <option value="">Choose a pattern…</option>
            ${SHAPES.map((shape) => html`<option value=${shape.id}>${shape.name}</option>`)}
          </select>
        </div>
        <button type="submit" class="primary">Reveal</button>
      </form>
    `;
  }

  private renderReveal(attempt: AttemptRecord): TemplateResult {
    return html`
      <section class="reveal" aria-live="polite">
        <h3>Reveal</h3>
        <dl class="reveal-results">
          <div class=${attempt.complexityCorrect ? "correct" : "incorrect"}>
            <dt>Actual complexity</dt>
            <dd>
              <strong>${attempt.actualComplexity}</strong> — you predicted
              ${attempt.predictedComplexity} ${attempt.complexityCorrect ? "✓" : "✗"}
            </dd>
          </div>
          <div class=${attempt.shapeCorrect ? "correct" : "incorrect"}>
            <dt>Pattern</dt>
            <dd>
              <strong>${shapeName(attempt.actualShapeId)}</strong> — you predicted
              ${shapeName(attempt.predictedShapeId)} ${attempt.shapeCorrect ? "✓" : "✗"}
            </dd>
          </div>
        </dl>
        <p class="explanation">${this.snippet.explanation}</p>
        <p class="review-link">
          <a href="/refresher.html#${attempt.actualShapeId}">
            Review this pattern in the refresher
          </a>
        </p>
        <button type="button" class="primary" @click=${this.nextSnippet}>Next snippet</button>
      </section>
    `;
  }

  protected override render(): TemplateResult {
    const highlighted = highlightCode(this.snippet.code, this.snippet.language);
    return html`
      <article class="gym-card">
        <div class="snippet-scroll">
          <pre class="snippet"><code
            class="hljs language-${this.snippet.language}"
          >${unsafeHTML(highlighted)}</code></pre>
        </div>
        ${this.phase === "predict" && this.attempt === null
          ? this.renderPredictForm()
          : this.renderReveal(this.attempt!)}
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "bigo-gym-card": BigoGymCard;
  }
}
