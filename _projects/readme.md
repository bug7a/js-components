# _projects

Your own basic.js projects, inside this repository. A project here can use the library (`basic/`) and every
component (`comp/`) straight from the repository, so you always work with the newest version.

## Start a project

1. Copy the folder `my-first-project/` and give the copy your project's name (Ex: `_projects/todo-list/`).
2. Open its `index.htm` with a local web server, not by double clicking the file
   (VS Code: the Live Server extension, "Open with Live Server"). Some components read files with `fetch`.
3. Write your page in `start()`. Every project is one or more `.htm` files with plain JavaScript: no build step.

A project two folders down from the root loads the files like this:

```html
<link rel="stylesheet" type="text/css" href="../../basic/basic.css">
<script src="../../basic/basic.js"></script>
<script src="../../comp/smart-button.js"></script>
```

## Find a component

- The catalog: open `index.htm` at the root of the repository (with a web server): every component with live
  samples and their code.
- `02-comp-examples/`: one or more sample pages for each component.
- The header of each file in `comp/` lists its params, and the files it needs (load them before it).
- Learning basic.js itself: `01-basic-js-by-example/` (the library, step by step) and
  `01-basic-js-by-example/_first-coding-projects/` (small projects for a first program).

## Take a project out of the repository

When a project is ready to live on its own (a web site, a GitHub repository), run this at the root:

```sh
./_make-standalone.sh _projects/my-first-project               # makes _dist/my-first-project/
./_make-standalone.sh _projects/my-first-project --out ~/site   # makes it in another folder
./_make-standalone.sh _projects/my-first-project --list        # only shows what it would do
```

Your project folder is not changed, so you go on working on it here. The ready copy (`_dist/my-first-project/`,
not in git) has the library in `basic/` and every component the pages use in one file, `comp/components.min.js`,
and its paths are rewritten, so the folder works anywhere. Run it again after a change: the copy is made again from
scratch (do not edit it). `--separate` makes one `.min.js` file for each component instead.
