# create-basicjs

Create a project with [basic.js](https://bug7a.github.io/basic.js/) and OzdenUI, ready to build with AI tools.

```sh
npm create basicjs@latest my-app
cd my-app
npx serve
```

The project has everything in one folder: `index.htm`, your code in `app/`, and the library, components, examples and documents in `_basic/`. `AGENTS.md` and `CLAUDE.md` give the rules to AI coding tools, so you can open the folder in one and describe your app.

## Templates

```sh
npm create basicjs@latest my-shop -- --template shop     # shop, booking, coffee-shop, classic, starter (mobile apps), panel, forms
npm create basicjs@latest -- --list
```

## Tools in a project

| Command | What it does |
| :--- | :--- |
| `node _basic/tools/check.js` | Opens the app in Chrome or Edge at a phone and a desktop width and lists errors, missing files, and things that leave the screen or are cut |
| `node _basic/tools/build.js` | Makes the ready site in `dist/` |
| `npx create-basicjs@latest update` | Replaces `_basic/`, and `AGENTS.md` when you did not change it (a changed one stays: the new one is written next to it as `AGENTS.new.md`) |

It needs Node.js 18 or newer. The app itself has no dependencies.

Documents: [Handbook](https://bug7a.github.io/basic.js-handbook/) · [Components](https://bug7a.github.io/js-components/)
