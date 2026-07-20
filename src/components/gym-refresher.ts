import { LitElement, html, type TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { SHAPES, type Shape } from "../catalogue";
import { COMPLEXITY_PROFILES } from "../content/big-o";
import { RUNNABLE_EXAMPLES } from "../content/runnable";
import "./gym-demo";

/**
 * Stateless card-per-shape reference, rendered straight from the catalogue so
 * the refresher can never drift from what the gym grades against. No
 * progress, no quiz — the gym is the quiz.
 */
@customElement("bigo-gym-refresher")
export class BigoGymRefresher extends LitElement {
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  protected override firstUpdated(): void {
    // Cards render after the browser's native anchor scroll has already
    // happened (and missed), so honor a deep link like #nested-iteration here.
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    this.querySelector(`#${CSS.escape(hash)}`)?.scrollIntoView();
  }

  private renderCard(shape: Shape): TemplateResult {
    return html`
      <section class="refresher-card" id=${shape.id}>
        <h2>${shape.name}</h2>
        <p><strong>Giveaway:</strong> ${shape.giveaway}</p>
        <bigo-gym-demo .example=${RUNNABLE_EXAMPLES[shape.id]}></bigo-gym-demo>
        <p><strong>Fix:</strong> ${shape.fix}</p>
      </section>
    `;
  }

  private renderPrimer(): TemplateResult {
    return html`
      <section class="refresher-primer" id="big-o">
        <h2>Big-O, briefly</h2>
        <p>
          Big-O describes how a piece of code's work grows as its input grows — not how fast it runs
          on any given day. Constants and one-off costs drop out; what survives is the curve. In
          real code the trap is rarely a deliberately slow algorithm — it is an innocent-looking
          O(n) call sitting inside another O(n) loop, which is exactly what the patterns below train
          you to spot.
        </p>
        <aside class="refresher-tip">
          <h3>Where to look first</h3>
          <p>
            Loops are where time complexity comes from. When you read code for Big-O, find the loops
            first: one loop over n items is O(n), a loop inside a loop is O(n²), and so on. Code
            with no loops at all runs in constant time — O(1) — however large the input.
          </p>
          <p>
            The catch: some loops hide inside a single call. <code>.includes()</code>,
            <code>.sort()</code>, spreading an array, or a helper that scans a list all loop on the
            inside — every pattern below is really a loop hiding in plain sight.
          </p>
        </aside>
        <div class="table-scroll">
          <table class="primer-table">
            <caption class="visually-hidden">
              The seven complexity classes used in the gym's answer set
            </caption>
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">How the work grows</th>
                <th scope="col">At scale</th>
                <th scope="col">Where you meet it</th>
              </tr>
            </thead>
            <tbody>
              ${COMPLEXITY_PROFILES.map(
                (profile) => html`
                  <tr>
                    <th scope="row">
                      <code>${profile.complexity}</code>
                      <span class="class-name">${profile.name}</span>
                    </th>
                    <td>${profile.growth}</td>
                    <td class="at-scale">${profile.atScale}</td>
                    <td>${profile.spotIt}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  protected override render(): TemplateResult {
    return html`${this.renderPrimer()}${SHAPES.map((shape) => this.renderCard(shape))}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "bigo-gym-refresher": BigoGymRefresher;
  }
}
