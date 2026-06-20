# Images

Drop your photos in this folder to have them appear on the site.

## Required

- **`portrait.jpg`** — your main photo, shown in the **About** section.
  - Best as a vertical / portrait crop (roughly 4:5, e.g. 800×1000px).
  - Until this file exists, the site shows a styled "Add images/portrait.jpg" placeholder (nothing looks broken).

## How to add it

1. Copy your photo into this `images/` folder and name it exactly `portrait.jpg`.
2. From the project folder, run:

   ```bash
   git add -A && git commit -m "Add portrait photo" && git push
   ```

3. The live site updates automatically in about a minute.

## Want more photos?

Tell Claude and it can add a gallery row (e.g. `gallery-1.jpg`, `gallery-2.jpg`, …) —
for example photos of the rocket payload, lab work, or projects.
