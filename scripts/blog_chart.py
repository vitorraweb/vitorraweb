#!/usr/bin/env python3
"""Draw a Vitorra-branded bar chart (PNG) for a blog article.

    scripts/.venv/bin/python scripts/blog_chart.py spec.json

spec.json:
    {
      "title": "Diesel has risen by a third since April",
      "subtitle": "Pump price per litre, Uganda shillings",
      "bars": [
        {"label": "April, national average", "value": 5090},
        {"label": "September, Moroto", "value": 7099, "highlight": true}
      ],
      "format": "Shs {:,.0f}",
      "source": "Source: Uganda Radio Network (22 Apr 2026); Daily Monitor (8 Oct 2026)",
      "output": "planning/blog/drafts/images/diesel-price.png"
    }

Horizontal bars (labels read naturally), one series, a direct label on every
bar so nothing depends on colour. Dark gold bars (3:1+ against the paper
background); "highlight" marks the one bar the article is about in ink.
Needs matplotlib: python3 -m venv scripts/.venv && scripts/.venv/bin/pip install matplotlib
"""
import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.patches import FancyBboxPatch

PAPER = "#FAFAF8"
INK = "#1E1E1E"
BODY = "#454545"
MUTED = "#8A8A8A"
GRID = "#E4DFD3"
BAR = "#7A6020"
GOLD = "#C5B27A"

for path in ("/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Supplemental/Georgia.ttf"):
    if Path(path).exists():
        font_manager.fontManager.addfont(path)
SANS = "Arial" if Path("/System/Library/Fonts/Supplemental/Arial.ttf").exists() else "DejaVu Sans"
SERIF = "Georgia" if Path("/System/Library/Fonts/Supplemental/Georgia.ttf").exists() else "DejaVu Serif"


def draw(spec: dict) -> Path:
    bars = spec["bars"]
    fmt = spec.get("format", "{:,.0f}")
    labels = [b["label"] for b in bars][::-1]
    values = [b["value"] for b in bars][::-1]
    colours = [INK if b.get("highlight") else BAR for b in bars][::-1]

    fig_h = 2.6 + 0.62 * len(bars)
    fig, ax = plt.subplots(figsize=(10, fig_h), dpi=160)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)

    vmax = max(values)
    height = 0.5
    for i, (v, c) in enumerate(zip(values, colours)):
        # Rounded data end, square at the baseline.
        ax.add_patch(FancyBboxPatch((0, i - height / 2), v, height,
                                    boxstyle="round,pad=0,rounding_size=0.08",
                                    mutation_aspect=vmax / 25, facecolor=c, edgecolor="none"))
        ax.add_patch(plt.Rectangle((0, i - height / 2), min(v, vmax * 0.02), height, facecolor=c, edgecolor="none"))
        ax.text(v + vmax * 0.012, i, fmt.format(v), va="center", ha="left",
                fontsize=12, color=INK, family=SANS, fontweight="bold" if c == INK else "normal")

    ax.set_xlim(0, vmax * 1.18)
    ax.set_ylim(-0.6, len(values) - 0.4)
    ax.set_yticks(range(len(labels)), labels, fontsize=12, color=BODY, family=SANS)
    ax.tick_params(axis="y", length=0, pad=10)
    ax.tick_params(axis="x", length=0, labelsize=10, labelcolor=MUTED)
    ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, _: f"{x:,.0f}"))
    for lbl in ax.get_xticklabels():
        lbl.set_family(SANS)
    ax.grid(axis="x", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    for side in ("top", "right", "bottom", "left"):
        ax.spines[side].set_visible(False)

    fig.text(0.02, 1 - 0.32 / fig_h, spec["title"], fontsize=19, color=INK, family=SERIF, ha="left", va="top")
    if spec.get("subtitle"):
        fig.text(0.02, 1 - 0.78 / fig_h, spec["subtitle"], fontsize=12, color=BODY, family=SANS, ha="left", va="top")
    fig.add_artist(plt.Line2D([0.02, 0.1], [1 - 0.16 / fig_h] * 2, color=GOLD, linewidth=2.5, transform=fig.transFigure))
    if spec.get("source"):
        fig.text(0.02, 0.28 / fig_h, spec["source"], fontsize=9.5, color=MUTED, family=SANS, ha="left", va="bottom")
    fig.text(0.98, 0.28 / fig_h, "VITORRA", fontsize=9.5, color=BAR, family=SERIF, ha="right", va="bottom")

    fig.subplots_adjust(left=0.3, right=0.97, top=1 - 1.25 / fig_h, bottom=0.85 / fig_h)

    out = Path(spec["output"])
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, facecolor=PAPER)
    plt.close(fig)
    return out


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    print(draw(json.loads(Path(sys.argv[1]).read_text())))
