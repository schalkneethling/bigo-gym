import { LitElement, html, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { SHAPES } from "../catalogue";
import { bucketByShape, type ShapeStats } from "../lib/stats";
import { loadAttempts } from "../lib/storage";
import { ATTEMPT_EVENT } from "./gym-card";

/**
 * Per-shape results panel. Accuracy is bucketed by catalogue shape on
 * purpose — no single aggregate score — so under-practiced shapes stay
 * visible alongside poorly-scoring ones.
 */
@customElement("bigo-gym-stats")
export class BigoGymStats extends LitElement {
  @state() private buckets: ShapeStats[] = [];

  private readonly refresh = (): void => {
    this.buckets = bucketByShape(loadAttempts());
  };

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.refresh();
    window.addEventListener(ATTEMPT_EVENT, this.refresh);
  }

  override disconnectedCallback(): void {
    window.removeEventListener(ATTEMPT_EVENT, this.refresh);
    super.disconnectedCallback();
  }

  private renderAccuracy(correct: number, attempts: number): TemplateResult {
    if (attempts === 0) {
      return html`<span class="not-practiced">—</span>`;
    }
    const pct = Math.round((correct / attempts) * 100);
    return html`
      <span class="accuracy-value">${pct}%</span>
      <span class="meter" style="--meter-fill: ${pct}%" aria-hidden="true"></span>
    `;
  }

  protected override render(): TemplateResult {
    const nameOf = new Map(SHAPES.map((s) => [s.id, s.name]));
    return html`
      <div class="table-scroll">
        <table class="stats-table">
          <caption class="visually-hidden">
            Attempts and accuracy per complexity pattern
          </caption>
          <thead>
            <tr>
              <th scope="col">Pattern</th>
              <th scope="col">Attempts</th>
              <th scope="col">Pattern correct</th>
              <th scope="col">Complexity correct</th>
            </tr>
          </thead>
          <tbody>
            ${this.buckets.map(
              (bucket) => html`
                <tr class=${bucket.attempts === 0 ? "not-practiced-row" : ""}>
                  <th scope="row">
                    <a href="/refresher.html#${bucket.shapeId}"> ${nameOf.get(bucket.shapeId)} </a>
                  </th>
                  <td class="num">${bucket.attempts}</td>
                  <td class="num">${this.renderAccuracy(bucket.shapeCorrect, bucket.attempts)}</td>
                  <td class="num">
                    ${this.renderAccuracy(bucket.complexityCorrect, bucket.attempts)}
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "bigo-gym-stats": BigoGymStats;
  }
}
