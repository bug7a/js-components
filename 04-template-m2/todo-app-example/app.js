/* Bismillah */
/*

TO-DO LIST APP (FOR WEB AND MOBILE):

- An application that keeps a to-do list.
- The list is saved in local storage at every change.
- A click on a task selects it; the trash at the top removes the selected tasks.

To make an android or iOS application with Apache Cordova.
https://cordova.apache.org/

How to make an Android application? (Language: Turkish)
https://www.youtube.com/watch?v=B6x7yKhKZbY

How to make an iOS application? (Language: Turkish)
https://www.youtube.com/watch?v=WZZwiI_5WQA

FOR YOUR CORDOVA PROJECT:
- The folder works on its own: basic/ is a copy of the library (min files). Copy the whole folder.
  To refresh basic/ after basic.js changes (from the root of the repository):
    ./_make-standalone.sh 04-template-m2/todo-app-example
- Add these settings to your cordova project config.xml file:
    <preference name="DisallowOverscroll" value="true" />
    <preference name="StatusBarOverlaysWebView" value="false" />
    <preference name="StatusBarStyle" value="darkcontent" />
    <preference name="Orientation" value="portrait" />
- Add these plugins to your cordova project:
    cordova plugin add cordova-plugin-statusbar

*/

"use strict";

// The sizes of the app
const APP_WIDTH = 500;
const MAX_ZOOM_WIDTH = 700;
const SPACE = 10;
const CONTENT_WIDTH = APP_WIDTH - (2 * SPACE);
const BAR_HEIGHT = 80;
const BAR_ROUND = 16;
const LIST_TOP = BAR_HEIGHT + (2 * SPACE);
const INPUT_WIDTH = 380;
const ADD_BUTTON_SIZE = 50;
const ADD_BUTTON_FONT_SIZE = 36;
const TRASH_CIRCLE_SIZE = 55;
const TRASH_ICON_SIZE = 35;
const BADGE_LEFT = 41; // from the left of the trash circle
const BADGE_TOP = -4; // from the top of the trash circle
const TICK_SIZE = 20;
const TEXT_WIDTH = 410;

// The colors of the app
const APP_COLOR = "white";
const BAR_COLOR = "whitesmoke";
const ADD_BUTTON_COLOR = "#23BCC1BB";
const TRASH_CIRCLE_COLOR = "#ED6D5230";
const SELECTED_COLOR = "tomato";
const TICK_BORDER_COLOR = "lightgray";
const BADGE_INK = "#141414";

const STORAGE_KEY = "todoApp-taskDataList";

// The state and the objects of the app. A task: { text, isSelected, row }. The newest task is the first.
const TodoApp = {
    tasks: [],
};

// First running function. (basic.js calls it when the page is ready)
const start = function () {

    TodoApp.fitPage();
    page.onResize(TodoApp.fitPage);

    TodoApp.buildView();
    TodoApp.loadTasks();
    TodoApp.tasks.forEach(TodoApp.createTaskRow);

};

// *** VIEW:

// The app is APP_WIDTH wide on every screen: a wider screen zooms it up to MAX_ZOOM_WIDTH.
TodoApp.fitPage = function () {
    page.fit(APP_WIDTH, MAX_ZOOM_WIDTH);
};

TodoApp.buildView = function () {

    // GROUP: The page (the app in the middle)
    HGroup({ align: "center top" });

        // BOX: The app
        startBox({ width: APP_WIDTH, height: "100%", color: APP_COLOR, position: "relative" });

            TodoApp.buildTaskList();
            TodoApp.buildAddBar();
            TodoApp.buildDeleteBar();

        endBox();

    endGroup();

};

TodoApp.buildAddBar = function () {

    // GROUP: Add a new task
    TodoApp.addBar = HGroup({
        left: SPACE,
        top: SPACE,
        width: CONTENT_WIDTH,
        height: BAR_HEIGHT,
        align: "left center",
        gap: 5,
        padding: [20, 0],
        color: BAR_COLOR,
        round: BAR_ROUND,
        position: "absolute",
    });

        // INPUT: The text of the new task
        TodoApp.txtNewTask = Input({
            width: INPUT_WIDTH,
            height: ADD_BUTTON_SIZE,
            minimal: 1,
            color: "transparent",
            placeholder: "Add a task",
        });
        TodoApp.txtNewTask.onEnter(TodoApp.addTask);

        // LABEL: The add button
        TodoApp.btnAdd = Label({
            width: ADD_BUTTON_SIZE,
            height: ADD_BUTTON_SIZE,
            text: "+",
            textAlign: "center",
            lineHeight: ADD_BUTTON_SIZE + "px",
            fontSize: ADD_BUTTON_FONT_SIZE,
            color: ADD_BUTTON_COLOR,
            textColor: White(0.95),
            round: ADD_BUTTON_SIZE / 2,
            clickable: 1,
            cursor: "pointer",
            role: "button",
            aria: { label: "Add the task" },
        });
        TodoApp.btnAdd.on("click", TodoApp.addTask);

    endGroup();

};

TodoApp.buildDeleteBar = function () {

    // BOX: Delete the selected tasks (over the add bar while a task is selected)
    TodoApp.deleteBar = startBox(SPACE, SPACE, CONTENT_WIDTH, BAR_HEIGHT, {
        color: BAR_COLOR,
        round: BAR_ROUND,
    });

        // BOX: The trash button
        const trash = startBox({
            width: TRASH_CIRCLE_SIZE,
            height: TRASH_CIRCLE_SIZE,
            color: TRASH_CIRCLE_COLOR,
            round: TRASH_CIRCLE_SIZE / 2,
            clickable: 1,
            cursor: "pointer",
            role: "button",
            aria: { label: "Delete the selected tasks" },
        });
        that.center();
        trash.on("click", TodoApp.removeSelectedTasks);

            // ICON: Trash
            Icon({ width: TRASH_ICON_SIZE, height: TRASH_ICON_SIZE, opacity: 0.9 });
            that.load("images/trash.svg");
            that.center();

        endBox();

        // LABEL: The count of the selected tasks (a badge at the top right of the trash)
        TodoApp.lblSelectedCount = Label({
            left: trash.left + BADGE_LEFT,
            top: trash.top + BADGE_TOP,
            width: "auto",
            height: "auto",
            text: "0",
            fontSize: 16,
            bold: 1,
            color: "white",
            textColor: BADGE_INK,
            border: 1,
            borderColor: BADGE_INK,
            padding: [7, 2],
            round: 50,
            opacity: 0.7,
        });

    endBox();

    TodoApp.deleteBar.visible = 0;

};

TodoApp.buildTaskList = function () {

    // BOX: The tasks (it scrolls)
    TodoApp.listBox = startBox(SPACE, LIST_TOP, CONTENT_WIDTH, "calc(100% - " + (LIST_TOP + SPACE) + "px)", {
        color: APP_COLOR,
        scrollY: 1,
    });

        // GROUP: The rows of the tasks
        TodoApp.listGroup = VGroup({ width: "100%", height: "auto", align: "left top" });
        endGroup();

    endBox();

    if (typeof ScrollBar !== "undefined") ScrollBar({ scrollableBox: TodoApp.listBox });

};

// One task: a row in the list (a click selects it).
TodoApp.createTaskRow = function (task) {

    task.row = createIn(TodoApp.listGroup, function () {

        // GROUP: Task
        const row = HGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 15,
            padding: [15, 10],
            color: APP_COLOR,
            round: 4,
            clickable: 1,
            cursor: "pointer",
            shrink: 0,
        });

            // BOX: Selection circle
            row.boxTick = Box({
                width: TICK_SIZE,
                height: TICK_SIZE,
                round: TICK_SIZE / 2,
                border: 1,
                borderColor: TICK_BORDER_COLOR,
                position: "relative",
                shrink: 0,
                css: { marginTop: "5px" }, // WHY: in the middle of the first line of the text
            });

            // LABEL: Task text
            row.lblText = Label({
                width: TEXT_WIDTH,
                height: "auto",
                plainText: task.text,
                color: "transparent",
                css: { whiteSpace: "normal", overflowWrap: "anywhere" },
            });

        endGroup();

        row.on("click", function () {
            TodoApp.toggleTask(task);
        });

        return row;

    });

    TodoApp.paintTask(task);

};

TodoApp.paintTask = function (task) {
    task.row.boxTick.color = task.isSelected ? SELECTED_COLOR : BAR_COLOR;
    task.row.boxTick.border = task.isSelected ? 0 : 1;
    task.row.lblText.textColor = task.isSelected ? SELECTED_COLOR : basic.TEXT_COLOR;
};

// The delete bar is shown while a task is selected.
TodoApp.paintDeleteBar = function () {
    const selectedCount = TodoApp.getSelectedTasks().length;
    TodoApp.lblSelectedCount.text = selectedCount;
    TodoApp.deleteBar.visible = (selectedCount > 0) ? 1 : 0;
};

// *** ACTIONS:

TodoApp.addTask = function () {

    const text = TodoApp.txtNewTask.value.trim();
    if (text == "") return;

    const task = { text: text, isSelected: 0, row: null };
    TodoApp.tasks.unshift(task);
    TodoApp.createTaskRow(task);
    // WHY: the newest task is the first row; createIn adds a row at the end
    TodoApp.listGroup.elem.prepend(task.row.elem);

    TodoApp.txtNewTask.value = "";
    TodoApp.saveTasks();

};

TodoApp.toggleTask = function (task) {
    task.isSelected = task.isSelected ? 0 : 1;
    TodoApp.paintTask(task);
    TodoApp.paintDeleteBar();
};

TodoApp.getSelectedTasks = function () {
    return TodoApp.tasks.filter(function (task) { return task.isSelected; });
};

TodoApp.removeSelectedTasks = function () {

    TodoApp.getSelectedTasks().forEach(function (task) {
        task.row.remove();
    });
    TodoApp.tasks = TodoApp.tasks.filter(function (task) { return !task.isSelected; });

    TodoApp.saveTasks();
    TodoApp.paintDeleteBar();

};

// *** STORAGE: (only the texts, the newest first)

TodoApp.saveTasks = function () {
    const texts = TodoApp.tasks.map(function (task) { return task.text; });
    basic.storage.save(STORAGE_KEY, texts);
};

TodoApp.loadTasks = function () {
    const texts = basic.storage.load(STORAGE_KEY) || [];
    TodoApp.tasks = texts.map(function (text) {
        return { text: String(text), isSelected: 0, row: null };
    });
};
