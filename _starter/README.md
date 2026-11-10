# My App

A web app made with [basic.js](https://bug7a.github.io/basic.js/) and OzdenUI. The whole interface is written in plain JavaScript.

## Run it

Serve this folder with a local web server, then open the address it shows:

```sh
npx serve
```

The VS Code **Live Server** extension works too. Some components read files, so opening `index.htm` by double click is not enough.

## Build with AI

Open this folder in Claude Code, Codex or another AI coding tool and describe your app. The tool reads `AGENTS.md` for the rules of the project.

## Publish it

```sh
node _basic/tools/build.js
```

This makes the ready site in `dist/`, with only the files your pages use. It needs Node.js and nothing else. Upload the files inside `dist/` to your host. When Chrome or Edge is installed, the command also checks the site. You can check any time with `node _basic/tools/check.js`.

## Update

```sh
npx create-basicjs@latest update
```

This replaces only `_basic/`. Your own files stay as they are.

## Where things are

| Path | What it holds |
| :--- | :--- |
| `index.htm` | The page: it loads the library, the components and your code |
| `app/` | Your code |
| `assets/` | Your pictures and files |
| `dist/` | The ready site. It is made by the command above: do not change it |
| `_basic/` | The library, the components, examples and documents. Do not change it: an update replaces this folder |

Documents: [Handbook](https://bug7a.github.io/basic.js-handbook/) · [Components](https://bug7a.github.io/js-components/)
