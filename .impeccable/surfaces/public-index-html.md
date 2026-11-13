---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: []
---

# Surface: UsBudget app shell + Головна

Scope: whole app UI (public/index.html), first surface — Головна. Visitor mode: Operate.
Audience/job: a couple on phones, seconds per visit: record an expense, see what is left this month, check upcoming payments and goals.
Structure (confirmed): 4 bottom tabs — Головна · Записи · Борги · Ще (Особисте, Регулярні, Цілі, Аналітика, Налаштування); a persistent "+" asks «Що сталося?» (expense, put on card, debt paid, income). Holiday banners, seasonal themes and monthly analytics move into Налаштування.
Must not feel: cold like a bank; faceless.

## Direction contract
FORM: Ринкові цінники (market price tags). seed:41fc5de7e9b8f570 (roll ran degraded: no challengers; user re-rolled once, then chose the first assignment).
THESIS: The month's money reads like a market stall: what matters carries a price tag you read from a metre away. Refuses the category default of a grey dashboard with cards and one blue accent.
OWN-WORLD: Sunflower-yellow shell (header field, active tab, the "+" button) on a cool light-grey ground, black ink, black bottom bar. Tags: white cardstock with a 2px black outline and a punched hole; limit tags in salad green (room left) and coral (spent). Condensed grotesk (Oswald) for amounts and section labels in caps, Inter for UI text.
STORY: Open → the big tag says how much is still free → limit tags show where it is tight → nearest payments → "+" records an expense in seconds.
FIRST VIEWPORT: Yellow header with month switcher; the "Можна ще витратити" tag (monthly contributions minus all shared spending) overlapping the header edge; a row of three limit tags; nearest payments list; "+" above a black 5-tab bar.
SIGNATURE: Amounts that answer "how much is left" are price tags — punched-hole white tag for the headline, coloured cardstock tags for limits; a new expense re-prices the tag.
RISK: Yellow + black could feel loud for daily use; keep yellow to the shell and active states, everything else neutral.
UPDATE (v5.4+): with seasonal themes on, the shell/accent take each month's pastel palette; yellow stays the "no seasons" colour and the limit-warning tag.
