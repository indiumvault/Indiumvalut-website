# IndiumVault

A free, mobile-friendly collection of browser-based utilities, practical guides, and a student/creator workspace.

**Live site:** https://indiumvault.github.io/Indiumvault-website/

## What is included
- **Labs:** word counter, text case converter, JSON formatter/validator, password generator, UUID generator, unit converter, percentage calculator, and text cleaner.
- **Launchpad:** task list, focus timer, weekly checkpoints, revision targets, and weekly timetable. Planner data stays in browser local storage on the current device.
- **Guides:** original practical instructions linked to relevant tools.
- **Project pages:** About, feedback, privacy policy, terms, and a custom 404 page.

## Hosting
This is a static website designed for GitHub Pages. It does not require a paid server, database, account system, or build step.

## Quality checks
GitHub Actions runs the static checks in `tests/site-checks.test.mjs` on pushes and pull requests. These checks catch common broken links, missing sitemap pages, and Launchpad markup/script issues; they are not a substitute for testing on real devices.

## Privacy and limitations
Most utilities run in the browser. Launchpad uses local storage, so saved planner data is tied to the browser and device. Review [Privacy](privacy.html) and [Terms](terms.html). Never put passwords or private information in public feedback.

## Contributing ideas
Use the [feedback page](feedback.html) to prepare a feature request or bug report, or open the [GitHub repository](https://github.com/indiumvault/Indiumvalut-website).