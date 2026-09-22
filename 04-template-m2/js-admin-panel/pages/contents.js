/* Bismillah */

/*

Contents Page (Template) - v26.09

- Pages, blog posts and banners of the site: summary, type tabs with counts, filters and a content table.
- Content editor (right view):
  - Title, URL (slug, created from the title), excerpt and the text (word count, reading time).
  - Type options: Page (show in the menu), Post (category, tags), Banner (link, placement).
  - Publishing: Draft, Published, Scheduled (date and time), Archived. Author.
  - Featured image from the Media Library.
  - SEO: meta title, meta description, search result preview and a checklist.
  - Preview in a new window, duplicate (as a draft), delete (hold to confirm).
  - Closing with unsaved changes asks first.
- Scheduled contents are published when their time comes (checked when the list is shown).
- Test data: About 40 contents, created one time. Changes are kept while the panel is open.
  Replace the "CONTENT SERVICE" functions with your service.

COMPONENTS:
- TextTabs, SearchInput, TinySelect (comp-m2): Filters
- SmartTable (comp-m3): Content list
- InputB (comp-m2): Editor fields
- RadioButton, CheckBox (comp-m3): Status, options
- SelectDate, SelectTime (comp-m4): Schedule
- ButtonWithIcon, HoldToConfirmButton (comp-m3): Actions
- Dialog, Waiting (comp-m2): Confirm, saving

*/

ContentsPageDefaults = {
    color: "transparent",
    openContentId: null, // Opens the editor of this content. "new": New content (Ex: from the top bar)
};

const ContentsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, ContentsPageDefaults, mainView);

    mainView.setKey(ContentsPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";
    const S = ContentsPage.STYLE;
    const TYPES = ContentsPage.TYPES;
    const STATUSES = ContentsPage.STATUSES;

    const TYPE_TABS = ["", "page", "post", "banner"]; // "": All

    const filter = {
        type: "",
        status: "",
        author: "",
        search: "",
    };

    let searchTimer = null;

    // Components
    let typeTabs;
    let statCards = [];
    let lblResultCount, smartTable;

    // *** PRIVATE FUNCTIONS:

    // All filters except the type (used for the tab counts too)
    const matchesFilters = function(content) {
        if (filter.status && content.status != filter.status) return false;
        if (filter.author && content.author != filter.author) return false;
        const search = filter.search.trim().toLowerCase();
        if (search && !(content.title + " " + content.slug + " " + content.tags.join(" ")).toLowerCase().includes(search)) return false;
        return true;
    };

    const render = function() {

        ContentsPage.publishDueContents();

        const list = ContentsPage.getContents().filter(matchesFilters);

        TYPE_TABS.forEach(function(type, index) {
            const count = (type) ? list.filter(function(content) { return content.type == type; }).length : list.length;
            const label = (type) ? TYPES[type].plural : "All";
            typeTabs.tabItemList[index].text = label + " <span style='opacity:0.55'>" + count + "</span>";
        });

        const shown = (filter.type) ? list.filter(function(content) { return content.type == filter.type; }) : list;

        smartTable.setItemDataList(shown.map(function(content) {
            return {
                id: content.id,
                title: content.title,
                type: TYPES[content.type].label,
                status: STATUSES[content.status].label,
                author: content.author,
                updated: ContentsPage.formatDateTime(content.updatedAt), // Sortable text
                views: content.views,
                seo: (ContentsPage.getSeoChecks(content).every(function(check) { return check.ok; })) ? "Good" : "Check",
            };
        }));

        lblResultCount.text = shown.length + " contents";

        renderSummary();

    };

    const renderSummary = function() {

        const contents = ContentsPage.getContents();
        const count = function(status) { return contents.filter(function(content) { return content.status == status; }).length; };
        const scheduled = contents.filter(function(content) { return content.status == "scheduled"; }).sort(function(a, b) { return a.publishAt - b.publishAt; });
        const seoIssues = contents.filter(function(content) {
            return content.status != "archived" && !ContentsPage.getSeoChecks(content).every(function(check) { return check.ok; });
        });
        const weekAgo = Date.now() - 7 * ContentsPage.DAY;

        const values = [
            { value: count("published"), desc: contents.filter(function(c) { return c.status == "published" && c.publishAt > weekAgo; }).length + " published this week" },
            { value: count("draft"), desc: "Not visible on the site" },
            { value: scheduled.length, desc: (scheduled.length) ? "Next: " + ContentsPage.formatDateTime(scheduled[0].publishAt) : "Nothing scheduled" },
            { value: seoIssues.length, desc: "Missing SEO info or image" },
        ];

        statCards.forEach(function(card, index) {
            card.lblValue.text = String(values[index].value);
            card.lblDesc.text = values[index].desc;
        });

    };

    const exportCSV = function() {

        const rows = smartTable.visibleItemDataList; // WHY: Also uses the sort and the search of the table.
        const quote = function(value) { return "\"" + String(value).replace(/"/g, "\"\"") + "\""; };
        const lines = ["id,title,type,status,author,updated,views,seo"].concat(rows.map(function(row) {
            return [row.id, row.title, row.type, row.status, row.author, row.updated, row.views, row.seo].map(quote).join(",");
        }));

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
        link.download = "contents-" + ContentsPage.formatDateTime(Date.now()).slice(0, 10) + ".csv";
        link.click();
        URL.revokeObjectURL(link.href);

    };

    const openEditor = function(content, newType) {
        ContentEditor({
            content: content, // null: New content
            newType: newType || filter.type || "post",
            onChange: function() {
                if (box) render();
            },
        });
    };

    const closeEditor = function() {
        if (rightView.isShown(ContentEditor.KEY)) {
            rightView.hide();
            rightView.clean();
        }
    };

    // *** VIEW HELPERS:

    const setFlex = function(obj, flex) {
        obj.elem.style.flex = flex;
        obj.elem.style.minWidth = "0";
    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {

        clearTimeout(searchTimer);
        closeEditor();

        // WHY: SmartTable and ContextMenu are on the page and have window events. box.remove() does not remove them.
        if (smartTable) smartTable.remove();
        if (box.newMenu) box.newMenu.remove();

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    const initHeader = function() {

        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.flexWrap = "wrap";
        that.elem.style.justifyContent = "space-between";

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                Label({ text: "Contents", fontSize: 26, textColor: Ink(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                Label({ text: "Pages, blog posts and banners of your site", fontSize: 14, textColor: Ink(0.5) });

            endGroup();

            HGroup({ width: "auto", height: "auto", align: "right center", gap: 10 });

                ContentsPage.createButton("Export CSV", ASSETS + "arrow_down.png", exportCSV);

                const btnNew = ContentsPage.createButton("New Content", ASSETS + "top-bar/add.png", function() {}, { primary: 1 });

                const newMenu = ContextMenu({
                    items: Object.keys(TYPES).map(function(type) { return { text: "New " + TYPES[type].label, key: type }; }),
                    onClick: function(self, item) { openEditor(null, item.key); },
                    style: ContentsPage.CONTEXT_MENU_STYLE,
                });
                newMenu.attachTo(btnNew, "click");
                box.newMenu = newMenu;

            endGroup();

        endGroup();

    };

    const initSummary = function() {

        const CARD_LIST = [
            { title: "Published", color: STATUSES.published.color },
            { title: "Drafts", color: STATUSES.draft.color },
            { title: "Scheduled", color: STATUSES.scheduled.color },
            { title: "SEO to check", color: T.warning },
        ];

        HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
        that.elem.style.flexWrap = "wrap";

            CARD_LIST.forEach(function(item, index) {

                const card = VGroup({ width: "auto", height: "auto", align: "left top", gap: 2, padding: 14, color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 });
                setFlex(card, "1 1 200px");

                    Label({ text: item.title, fontSize: 13, textColor: Ink(0.5) });
                    card.lblValue = Label({ text: "", fontSize: 26, textColor: item.color });
                    card.lblDesc = Label({ text: "", fontSize: 12, textColor: Ink(0.45) });

                endGroup();

                statCards.push(card);

            });

        endGroup();

    };

    const initToolbar = function() {

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 12, padding: 16, color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 });

            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.flexWrap = "wrap";

                typeTabs = TextTabs({
                    tabHeight: 40, // The same height as the buttons / inputs next to it
                    tabList: TYPE_TABS.map(function(type) { return (type) ? TYPES[type].plural : "All"; }),
                    onClick: function(self) {
                        filter.type = TYPE_TABS[self.index];
                        render();
                    },
                    backgroundStyle: { colorBottom: S.FIELD_COLOR, colorTop: S.FIELD_COLOR, round: 8, border: 1, borderColor: S.CARD_BORDER_COLOR },
                    tabPadding: [3, 3],
                    labelStyle: { fontSize: 14, textColor: Ink(0.85), padding: [12, 6] },
                    selectedStyle: { color: S.PRIMARY_COLOR, round: 6 },
                });

                SearchInput({
                    width: 240,
                    height: 40,
                    border: 1,
                    borderColor: S.CARD_BORDER_COLOR,
                    borderBottomStyle: "1px solid " + S.CARD_BORDER_COLOR,
                    round: 8,
                    color: S.FIELD_COLOR,
                    textColor: Ink(0.9),
                    fontSize: 14,
                    searchIconSize: 16,
                    placeholderText: "Title, URL or tag",
                    invertIconColor: T.invertIcon,
                    searchIconFile: LIB_PATH + "comp-m2/search-input-v2/search.svg",
                    clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    onSearch: function(text) {
                        filter.search = text;
                        searchTimer = waitAndRun(searchTimer, render, 150);
                    },
                });
                that.position = "relative";

                ContentsPage.createTinySelect(
                    [{ id: "", label: "All statuses" }].concat(Object.keys(STATUSES).map(function(id) { return { id: id, label: STATUSES[id].label }; })),
                    function(id) { filter.status = id; render(); }
                );

                ContentsPage.createTinySelect(
                    [{ id: "", label: "All authors" }].concat(ContentsPage.getAuthors().map(function(name) { return { id: name, label: name }; })),
                    function(id) { filter.author = id; render(); }
                );

                // Space
                HGroup({ width: "auto", height: 1 });
                that.elem.style.flex = "1 1 auto";
                endGroup();

                lblResultCount = Label({ text: "", fontSize: 13, textColor: Ink(0.55) });

            endGroup();

        endGroup();

    };

    const initTable = function() {

        HGroup({ width: "100%", height: 640, align: "left top" });

            smartTable = SmartTable({
                titleDataList: [
                    { name: "TITLE", dataTitle: "title", dataType: "string", width: 300, shortable: 1 },
                    { name: "TYPE", dataTitle: "type", dataType: "string", width: 100, shortable: 1 },
                    { name: "STATUS", dataTitle: "status", dataType: "string", width: 120, shortable: 1 },
                    { name: "AUTHOR", dataTitle: "author", dataType: "string", width: 160, shortable: 1 },
                    { name: "UPDATED", dataTitle: "updated", dataType: "string", width: 170, shortable: 1 },
                    { name: "VIEWS", dataTitle: "views", dataType: "integer", width: 100, shortable: 1 },
                    { name: "SEO", dataTitle: "seo", dataType: "string", width: 90, shortable: 1 },
                ],
                itemDataList: [],
                titleHeight: 44,
                itemHeight: 40,
                infoHeight: 56,
                itemLineCount: 13,
                sortByTitleIndex: 4,
                sortDirection: "Z-A", // Last updated first
                onSelect: function(itemData) {
                    const content = ContentsPage.getContents().find(function(c) { return c.id == itemData.id; });
                    if (content) openEditor(content);
                },
                // WHY: SmartTable writes the raw value. Texts and colors are written here.
                updateCustomItemCell: function(cell, titleDataIndex, data) {
                    if (titleDataIndex == 2) {
                        const status = ContentsPage.getStatusByLabel(data);
                        cell.label.textColor = (status) ? status.color : Ink(0.75);
                    }
                    if (titleDataIndex == 5 && data !== "") {
                        cell.label.text = Number(data).toLocaleString("en-US");
                    }
                    if (titleDataIndex == 6) {
                        cell.label.textColor = (data == "Good") ? S.ACCENT_COLOR : T.warning;
                    }
                },
                ...ContentsPage.getSmartTableStyle(LIB_PATH),
            });

        endGroup();

    };

    // *** PAGE INIT CODE:

    // BOX: Scrollable container
    // WHY: page does not scroll. Scrollable content must be inside a Box with scrollY: 1.
    startBox(0, 0, "100%", "100%", {
        color: "transparent",
        scrollY: 1,
    });

        VGroup({
            width: "100%",
            height: "auto", // Grows with content, so the Box can scroll.
            align: "left top",
            gap: 16,
            padding: 24,
        });

            initHeader();
            initSummary();
            initToolbar();
            initTable();

        endGroup();

    endBox();

    render();

    box.endPage();

    if (box.openContentId === "new") {
        openEditor(null, "post");
    } else if (box.openContentId !== null) {
        const content = ContentsPage.getContents().find(function(c) { return c.id == box.openContentId; });
        if (content) openEditor(content);
    }

    return box;

};

ContentsPage.KEY = "Contents";

// *** CONTENT EDITOR (RIGHT VIEW):

const ContentEditorDefaults = {
    content: null, // null: New content
    newType: "post", // Type of a new content: "page", "post", "banner"
    onChange: function() {},
};

const ContentEditor = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ContentEditorDefaults);

    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = T.surfaceDeep;

    // WHY: content is a live object of the list. startObject() would copy it.
    const content = params.content;
    delete params.content;

    // BOX: Component container
    let box = startObject(params);

    const S = ContentsPage.STYLE;
    const TYPES = ContentsPage.TYPES;
    const STATUSES = ContentsPage.STATUSES;
    const escape = ContentsPage.escapeHtml;

    const isNew = !content;
    const draft = (isNew) ? ContentsPage.createEmptyContent(box.newType) : JSON.parse(JSON.stringify(content));
    const original = JSON.stringify(draft);
    let isSlugEdited = !isNew; // WHY: The slug follows the title only for a new content, until it is changed by the user.

    const radioList = [];
    let saveTimer = null;

    // Components
    let inputTitle, inputSlug, lblUrl, inputExcerpt, bodyArea, lblBodyInfo;
    let grpPageOptions, grpPostOptions, grpBannerOptions, inputTags, inputLink;
    let grpSchedule, dateSchedule, timeSchedule;
    let grpImages, inputMetaTitle, inputMetaDescription, grpSeoPreview, grpSeoChecks, lblSeoScore;
    let lblError, btnSave;

    // *** CONTENT SERVICE (TEST):

    const saveContent = function() {

        const error = validate();
        lblError.text = error;
        if (error) return;

        btnSave.elem.inert = true;
        if (typeof waiting !== "undefined") waiting.show();

        saveTimer = setTimeout(function() {

            // TODO: Save with your service.
            draft.updatedAt = Date.now();
            draft.updatedBy = ContentsPage.getCurrentUserName();
            if (draft.status == "published" && (isNew || content.status != "published")) draft.publishAt = Date.now();

            if (isNew) {
                draft.id = ContentsPage._nextId++;
                ContentsPage.getContents().push(draft);
            } else {
                Object.assign(content, draft);
            }

            if (typeof waiting !== "undefined") waiting.hide();

            box.onChange();
            rightView.hide();
            rightView.clean();

        }, 400);

    };

    const deleteContent = function() {
        // TODO: Delete with your service.
        const list = ContentsPage.getContents();
        const index = list.indexOf(content);
        if (index >= 0) list.splice(index, 1);
        box.onChange();
        rightView.hide();
        rightView.clean();
    };

    const duplicateContent = function() {
        // TODO: Create with your service.
        const copy = JSON.parse(JSON.stringify(content));
        copy.id = ContentsPage._nextId++;
        copy.title = content.title + " (copy)";
        copy.slug = ContentsPage.getUniqueSlug(content.slug + "-copy", content.type);
        copy.status = "draft";
        copy.views = 0;
        copy.updatedAt = Date.now();
        copy.updatedBy = ContentsPage.getCurrentUserName();
        ContentsPage.getContents().push(copy);
        box.onChange();
        ContentEditor({ content: copy, onChange: box.onChange }); // Open the copy
    };

    // Closes the editor. Asks first if there are unsaved changes.
    const closeEditor = function() {
        if (JSON.stringify(draft) == original) {
            rightView.hide();
            rightView.clean();
            return;
        }
        Dialog({
            icon: "assets/warning.png",
            title: "Unsaved Changes",
            desc: "Your changes to <b>" + escape(draft.title || "this content") + "</b> will be lost.",
            confirmButtonText: "Discard",
            cancelButtonText: "Keep Editing",
            confirmButtonColor: S.ERROR_COLOR,
            callback: function(isConfirmed) {
                if (!isConfirmed || !box) return;
                rightView.hide();
                rightView.clean();
            },
        });
    };

    // *** PRIVATE FUNCTIONS:

    // Returns an error text, or "".
    const validate = function() {
        if (!draft.title.trim()) return "Title is required.";
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug)) return "URL: small letters, numbers and \"-\" only.";
        const used = ContentsPage.getContents().some(function(c) { return c !== content && c.type == draft.type && c.slug == draft.slug; });
        if (used) return "URL \"" + draft.slug + "\" is used by another " + TYPES[draft.type].label.toLowerCase() + ".";
        if (draft.status == "scheduled" && !(draft.publishAt > Date.now())) return "Schedule time must be in the future.";
        if (draft.type == "banner" && draft.link && !/^(https?:\/\/|\/)/.test(draft.link)) return "Link must start with \"/\" or \"https://\".";
        return "";
    };

    const updateUrl = function() {
        lblUrl.text = escape(ContentsPage.getUrl(draft));
    };

    const updateBodyInfo = function() {
        const words = ContentsPage.countWords(draft.body);
        lblBodyInfo.text = words + " words · " + Math.max(1, Math.round(words / 200)) + " min read";
    };

    const updateTypeView = function() {
        grpPageOptions.visible = (draft.type == "page") ? 1 : 0;
        grpPostOptions.visible = (draft.type == "post") ? 1 : 0;
        grpBannerOptions.visible = (draft.type == "banner") ? 1 : 0;
        updateUrl();
        updateSeo();
    };

    const updateScheduleView = function() {
        grpSchedule.visible = (draft.status == "scheduled") ? 1 : 0;
        updateSaveButton();
    };

    const updateSaveButton = function() {
        const texts = { draft: "Save Draft", published: (isNew || content.status != "published") ? "Publish" : "Update", scheduled: "Schedule", archived: "Archive" };
        btnSave.setText(texts[draft.status]);
    };

    // Schedule time from the date and time fields
    const updateScheduleTime = function() {
        const date = dateSchedule.getDate();
        const time = timeSchedule.getTime();
        if (!date || !time) { draft.publishAt = 0; return; }
        date.setHours(time.hours, time.minutes, 0, 0);
        draft.publishAt = date.getTime();
    };

    const updateSeo = function() {

        // Preview (like a search result)
        const title = draft.metaTitle || draft.title || "Title";
        const description = draft.metaDescription || draft.excerpt || "Add a meta description to show a summary in the search results.";
        grpSeoPreview.lblTitle.text = escape(ContentsPage.cut(title, 60));
        grpSeoPreview.lblUrl.text = escape(ContentsPage.getUrl(draft));
        grpSeoPreview.lblDescription.text = escape(ContentsPage.cut(description, 160));

        // Checklist
        const checks = ContentsPage.getSeoChecks(draft);
        const okCount = checks.filter(function(check) { return check.ok; }).length;
        lblSeoScore.text = okCount + " / " + checks.length;
        lblSeoScore.textColor = (okCount == checks.length) ? S.ACCENT_COLOR : T.warning;
        grpSeoChecks.lines.forEach(function(line, index) {
            const check = checks[index];
            line.visible = (check) ? 1 : 0;
            if (!check) return;
            line.text = "<span style='color:" + ((check.ok) ? S.ACCENT_COLOR : T.warning) + "'>" + ((check.ok) ? "✓" : "!") + "</span>&nbsp;&nbsp;" + check.text;
        });

    };

    const renderImages = function() {

        const images = ContentsPage.getImages();

        grpImages.items.forEach(function(item) { item.remove(); });
        grpImages.items = [];

        const previous = getDefaultContainerBox();
        setDefaultContainerBox(grpImages);

            // "No image" tile
            const createTile = function(url, title) {
                const tile = Box({ width: 72, height: 72, round: 8, border: 2, color: S.FIELD_COLOR, clickable: 1 });
                tile.position = "relative";
                tile.elem.style.cursor = "pointer";
                tile.elem.title = title;
                tile.borderColor = (draft.image == url) ? S.ACCENT_COLOR : "transparent";
                tile.on("click", function() {
                    draft.image = url;
                    renderImages();
                    updateSeo();
                });
                grpImages.items.push(tile);
                return tile;
            };

            const tileNone = createTile("", "No image");
            const previousTile = getDefaultContainerBox();
            setDefaultContainerBox(tileNone);
                HGroup({ left: 0, top: 0, width: "100%", height: "100%", align: "center center" });
                    Label({ text: "None", fontSize: 12, textColor: Ink(0.5) });
                endGroup();
            setDefaultContainerBox(previousTile);

            images.forEach(function(image) {
                const tile = createTile(image.url, image.name);
                tile.elem.style.backgroundImage = "url(\"" + image.url + "\")";
                tile.elem.style.backgroundSize = "cover";
                tile.elem.style.backgroundPosition = "center";
            });

        setDefaultContainerBox(previous);

    };

    // *** VIEW HELPERS:

    const startSection = function(title, rightText) {
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: 10, padding: [16, 14], color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 10 });
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
        that.elem.style.justifyContent = "space-between";
            Label({ text: title.toUpperCase(), fontSize: 11, textColor: Ink(0.45) });
            that.elem.style.letterSpacing = "1px";
            group.lblRight = Label({ text: rightText || "", fontSize: 12, textColor: Ink(0.5) });
        endGroup();
        return group;
    };

    const createFieldTitle = function(text) {
        Label({ text: text, fontSize: 11, textColor: Ink(0.45) });
        that.elem.style.letterSpacing = "1px";
        return that;
    };

    // Dark style for InputB
    const createInput = function(params) {
        const input = InputB({
            width: "100%",
            leftPadding: 14,
            rightPadding: 36,
            backgroundColor: S.FIELD_COLOR,
            selectedBackgroundColor: T.surface3,
            lineColor: "transparent",
            selectedLineColor: "transparent",
            backBorderColor: S.CARD_BORDER_COLOR,
            selectedBackBorderColor: S.ACCENT_COLOR,
            backBorderTopRound: 8,
            backBorderBottomRound: 8,
            requiredColor: S.ERROR_COLOR,
            warningColor: S.ERROR_COLOR,
            isRequired: 0,
            ...params,
        });
        // WHY: InputB has fixed text colors for light backgrounds.
        input.title.textColor = Ink(0.45);
        input.title.fontSize = 11;
        input.title.elem.style.letterSpacing = "1px";
        input.input.textColor = Ink(0.9);
        input.input.fontSize = 15;
        input.input.height = 32;
        input.warningBall.borderColor = S.CARD_COLOR;
        return input;
    };

    const startRow = function() {
        HGroup({ width: "100%", height: "auto", align: "left top", gap: 10 });
    };

    const flex = function(obj) {
        obj.elem.style.flex = "1 1 0";
        obj.elem.style.minWidth = "0";
    };

    const darkRadioStyle = {
        mark: { width: 20, height: 20, color: "transparent", borderColor: Ink(0.35) },
        checkedMark: { color: "transparent", borderColor: S.ACCENT_COLOR },
        hoverMark: { borderColor: Ink(0.7) },
        dot: { color: S.ACCENT_COLOR },
        label: { fontSize: 14, textColor: Ink(0.9) },
    };

    const darkCheckStyle = {
        layout: { padding: [0, 2] },
        mark: { width: 20, height: 20, color: "transparent", borderColor: Ink(0.35) },
        checkedMark: { color: S.PRIMARY_COLOR, borderColor: S.PRIMARY_COLOR },
        hoverMark: { borderColor: Ink(0.7) },
        tick: { color: Ink(1) },
        label: { fontSize: 14, textColor: Ink(0.9) },
    };

    box.destroy = function() {
        clearTimeout(saveTimer);
        radioList.forEach(function(radio) { radio.remove(); }); // WHY: Radio groups are static lists.
        if (dateSchedule) dateSchedule.remove();
        if (timeSchedule && timeSchedule.remove) timeSchedule.remove();
        box.remove();
        box = null;
    };

    // *** VIEW:

    // Left line
    Box(0, 0, 1, "100%", { color: Ink(0.12) });

    // GROUP: Scrollable content
    startBox(0, 0, "100%", "calc(100% - 76px)", { color: "transparent", scrollY: 1 });

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 14, padding: 20 });

            // TITLE
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.justifyContent = "space-between";

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                    Label({ text: (isNew) ? "New " + TYPES[draft.type].label : "Edit " + TYPES[draft.type].label, fontSize: 20, textColor: Ink(0.95) });
                    that.elem.style.fontFamily = "opensans-bold";
                    if (!isNew) {
                        Label({ text: "Last change: " + new Date(content.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) + " by " + escape(content.updatedBy) + " · " + content.views.toLocaleString("en-US") + " views", fontSize: 12, textColor: Ink(0.45) });
                    }
                endGroup();

                Icon({ width: 28, height: 28, clickable: 1 });
                that.load("assets/close.png");
                that.elem.style.filter = T.iconFilter;
                that.elem.style.cursor = "pointer";
                that.opacity = 0.6;
                that.on("click", closeEditor);

            endGroup();

            // CONTENT
            startSection("Content");

                inputTitle = createInput({
                    titleText: "TITLE",
                    inputValue: draft.title, // WHY: Created with the value, so a required warning ball is not left on the screen.
                    placeholder: "Ex: How to choose headphones",
                    maxChar: 100,
                    onEdit: function() {
                        draft.title = inputTitle.getInputValue();
                        if (!isSlugEdited) {
                            draft.slug = ContentsPage.slugify(draft.title);
                            inputSlug.setInputValue(draft.slug);
                            updateUrl();
                        }
                        updateSeo();
                    },
                });

                inputSlug = createInput({
                    titleText: "URL",
                    inputValue: draft.slug,
                    placeholder: "how-to-choose-headphones",
                    maxChar: 80,
                    onEdit: function() {
                        const value = inputSlug.getInputValue().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-");
                        if (value != inputSlug.getInputValue()) inputSlug.setInputValue(value);
                        draft.slug = value;
                        isSlugEdited = true;
                        updateUrl();
                        updateSeo();
                    },
                });

                lblUrl = Label({ text: "", fontSize: 12, textColor: Ink(0.45), width: "100%" });
                that.elem.style.marginTop = "-4px";
                that.elem.style.wordBreak = "break-all";

                inputExcerpt = createInput({
                    titleText: "EXCERPT",
                    inputValue: draft.excerpt,
                    placeholder: "A short summary for lists (optional)",
                    maxChar: 200,
                    onEdit: function() { draft.excerpt = inputExcerpt.getInputValue(); updateSeo(); },
                });

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
                that.elem.style.justifyContent = "space-between";
                    createFieldTitle("TEXT");
                    lblBodyInfo = Label({ text: "", fontSize: 12, textColor: Ink(0.45) });
                endGroup();

                // TEXTAREA: Content text (native, so it has a normal text editing)
                const bodyBox = Box({ width: "100%", height: 220, color: S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 });
                bodyBox.position = "relative";
                bodyArea = document.createElement("textarea");
                bodyArea.value = draft.body;
                bodyArea.placeholder = "Write the content. A line that starts with \"## \" is a heading.";
                // WHY: basic.css gives "pointer-events: none" to the boxes and "user-select: none" to the page. They are inherited,
                // so the textarea could not be clicked or selected. They are set back for the textarea.
                bodyArea.style.cssText = "position:absolute; left:0; top:0; width:100%; height:100%; box-sizing:border-box; padding:12px 14px; " +
                    "background:transparent; border:0; outline:none; resize:none; color:" + Ink(0.9) + "; font-family:inherit; font-size:15px; line-height:1.6; " +
                    "pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text;";
                bodyArea.addEventListener("focus", function() { bodyBox.borderColor = S.ACCENT_COLOR; });
                bodyArea.addEventListener("blur", function() { bodyBox.borderColor = S.CARD_BORDER_COLOR; });
                bodyArea.addEventListener("input", function() {
                    draft.body = bodyArea.value;
                    updateBodyInfo();
                    updateSeo();
                });
                bodyBox.elem.appendChild(bodyArea);

                // PAGE OPTIONS
                grpPageOptions = VGroup({ width: "100%", height: "auto", align: "left top", gap: 8 });
                    CheckBox({
                        labelText: "Show in the site menu",
                        checked: draft.showInMenu,
                        style: darkCheckStyle,
                        onChange: function(self) { draft.showInMenu = self.checked; },
                    });
                endGroup();

                // POST OPTIONS
                grpPostOptions = VGroup({ width: "100%", height: "auto", align: "left top", gap: 10 });

                    startRow();

                        VGroup({ width: "auto", height: "auto", align: "left top", gap: 6 });
                        that.elem.style.flexShrink = "0";
                            createFieldTitle("CATEGORY");
                            that.elem.style.marginTop = "4px";
                            ContentsPage.createTinySelect(
                                ContentsPage.CATEGORIES.map(function(name) { return { id: name, label: name }; }),
                                function(id) { draft.category = id; },
                                Math.max(0, ContentsPage.CATEGORIES.indexOf(draft.category))
                            );
                        endGroup();

                        inputTags = createInput({
                            titleText: "TAGS",
                            inputValue: draft.tags.join(", "),
                            placeholder: "audio, guide (comma between tags)",
                            maxChar: 120,
                            onEdit: function() {
                                draft.tags = inputTags.getInputValue().split(",").map(function(tag) { return tag.trim().toLowerCase(); }).filter(Boolean);
                            },
                        });
                        flex(inputTags);

                    endGroup();

                endGroup();

                // BANNER OPTIONS
                grpBannerOptions = VGroup({ width: "100%", height: "auto", align: "left top", gap: 10 });

                    startRow();

                        inputLink = createInput({
                            titleText: "LINK",
                            inputValue: draft.link,
                            placeholder: "/summer-sale or https://...",
                            maxChar: 200,
                            onEdit: function() { draft.link = inputLink.getInputValue().trim(); },
                        });
                        flex(inputLink);

                        VGroup({ width: "auto", height: "auto", align: "left top", gap: 6 });
                        that.elem.style.flexShrink = "0";
                            createFieldTitle("PLACEMENT");
                            that.elem.style.marginTop = "4px";
                            ContentsPage.createTinySelect(
                                ContentsPage.PLACEMENTS.map(function(name) { return { id: name, label: name }; }),
                                function(id) { draft.placement = id; },
                                Math.max(0, ContentsPage.PLACEMENTS.indexOf(draft.placement))
                            );
                        endGroup();

                    endGroup();

                endGroup();

            endGroup();

            // PUBLISHING
            startSection("Publishing");

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 18 });
                that.elem.style.flexWrap = "wrap";

                    Object.keys(STATUSES).forEach(function(status) {
                        const radio = RadioButton({
                            group: "contentStatus",
                            value: status,
                            checked: (draft.status == status) ? 1 : 0,
                            labelText: STATUSES[status].label,
                            style: darkRadioStyle,
                            onChange: function(self) {
                                draft.status = self.value;
                                if (draft.status == "scheduled" && !draft.publishAt) updateScheduleTime();
                                updateScheduleView();
                            },
                        });
                        radioList.push(radio);
                    });

                endGroup();

                Label({ text: "Draft: only the team can see it. Published: visible on the site. Scheduled: published at the time. Archived: hidden, kept for later.", fontSize: 12, textColor: Ink(0.45), width: "100%" });

                // Schedule
                grpSchedule = HGroup({ width: "100%", height: "auto", align: "left bottom", gap: 10 });
                that.elem.style.flexWrap = "wrap";

                    const tomorrow = new Date(Date.now() + ContentsPage.DAY);
                    const scheduleStart = (draft.publishAt > Date.now()) ? new Date(draft.publishAt) : tomorrow;

                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 6 });
                        createFieldTitle("PUBLISH DATE");
                        dateSchedule = SelectDate({
                            width: 170,
                            height: 40,
                            date: scheduleStart,
                            minDate: new Date(),
                            format: "DD MMM YYYY",
                            showClearButton: 0,
                            style: ContentsPage.DATE_STYLE,
                            onChange: function() { updateScheduleTime(); },
                        });
                    endGroup();

                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 6 });
                        createFieldTitle("TIME");
                        timeSchedule = SelectTime({
                            width: 120,
                            height: 40,
                            time: (draft.publishAt > Date.now()) ? scheduleStart : "09:00",
                            minuteStep: 15,
                            showClearButton: 0,
                            style: ContentsPage.TIME_STYLE,
                            onChange: function() { updateScheduleTime(); },
                        });
                    endGroup();

                endGroup();

                // Author
                HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
                that.elem.style.marginTop = "4px";
                    createFieldTitle("AUTHOR");
                    const authors = ContentsPage.getAuthors();
                    if (!authors.includes(draft.author)) authors.push(draft.author);
                    ContentsPage.createTinySelect(
                        authors.map(function(name) { return { id: name, label: name }; }),
                        function(id) { draft.author = id; },
                        Math.max(0, authors.indexOf(draft.author))
                    );
                endGroup();

            endGroup();

            // FEATURED IMAGE
            startSection("Featured image", "From the Media Library");

                grpImages = HGroup({ width: "100%", height: "auto", align: "left top", gap: 8 });
                that.elem.style.flexWrap = "wrap";
                grpImages.items = [];
                endGroup();

            endGroup();

            // SEO
            const seoSection = startSection("SEO", "");
            lblSeoScore = seoSection.lblRight;

                inputMetaTitle = createInput({
                    titleText: "META TITLE",
                    inputValue: draft.metaTitle,
                    placeholder: "Empty: the title is used",
                    maxChar: 70,
                    onEdit: function() { draft.metaTitle = inputMetaTitle.getInputValue(); updateSeo(); },
                });

                inputMetaDescription = createInput({
                    titleText: "META DESCRIPTION",
                    inputValue: draft.metaDescription,
                    placeholder: "70-160 letters. Shown in the search results.",
                    maxChar: 170,
                    onEdit: function() { draft.metaDescription = inputMetaDescription.getInputValue(); updateSeo(); },
                });

                // Search result preview
                grpSeoPreview = VGroup({ width: "100%", height: "auto", align: "left top", gap: 2, padding: [14, 12], color: "#FFFFFF", round: 8 });
                    grpSeoPreview.lblUrl = Label({ text: "", fontSize: 12, textColor: "#3C4043", width: "100%" });
                    that.elem.style.wordBreak = "break-all";
                    grpSeoPreview.lblTitle = Label({ text: "", fontSize: 18, textColor: "#1A0DAB", width: "100%" });
                    grpSeoPreview.lblDescription = Label({ text: "", fontSize: 13, textColor: "#4D5156", width: "100%" });
                endGroup();

                // Checklist
                grpSeoChecks = VGroup({ width: "100%", height: "auto", align: "left top", gap: 4 });
                grpSeoChecks.lines = [];
                    for (let i = 0; i < 6; i++) {
                        grpSeoChecks.lines.push(Label({ text: "", fontSize: 13, textColor: Ink(0.8), width: "100%" }));
                    }
                endGroup();

            endGroup();

        endGroup();

    endBox();

    // GROUP: Buttons (bottom)
    HGroup({ left: 0, bottom: 0, width: "100%", height: 76, align: "left center", gap: 8, padding: [20, 0] });
    that.elem.style.borderTop = "1px solid " + Ink(0.08);

        if (!isNew) {

            const btnDelete = HoldToConfirmButton({
                height: 40,
                labelText: "Hold to Delete",
                completedText: "DELETED",
                iconFile: "../../comp-m3/hold-to-confirm-button/trash.png",
                holdingIconFile: "../../comp-m3/hold-to-confirm-button/trash-red.png",
                holdDuration: 1200,
                resetDelay: 600,
                style: {
                    layout: { gap: 6, padding: [14, 0] },
                    icon: { width: 20, height: 20 },
                    label: { fontSize: 14, textColor: Ink(0.9) },
                    holdingLabel: { fontSize: 14, textColor: "#B03A2E" },
                    completedLabel: { fontSize: 14, textColor: T.primaryActive },
                    box: { color: S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 },
                    holdingBox: { color: "#FFD1CB", borderColor: S.ERROR_COLOR, round: 8 },
                    completedBox: { color: "#DFEFE6", borderColor: S.ACCENT_COLOR, round: 8 },
                },
                onConfirm: deleteContent,
            });
            btnDelete.icon.elem.style.filter = T.iconFilter; // WHY: Only the normal icon is on a dark background.

            ContentsPage.createButton("Duplicate", "", duplicateContent);

        }

        ContentsPage.createButton("Preview", "", function() { ContentsPage.openPreview(draft); });

        lblError = Label({ text: "", fontSize: 13, textColor: S.ERROR_COLOR, textAlign: "right" });
        lblError.elem.style.flex = "1 1 auto";
        lblError.elem.style.minWidth = "0";

        btnSave = ContentsPage.createButton("Save", "", saveContent, { primary: 1 });

    endGroup();

    // *** INIT CODE:

    // WHY: Hidden after they are created. Objects created in a hidden (display: none) group are not flex items.
    updateTypeView();
    updateScheduleView();
    updateBodyInfo();
    updateUrl();
    renderImages();
    updateSeo();

    rightView.clean();
    rightView.setKey(ContentEditor.KEY);
    rightView.setWidth(640);
    rightView.add(box);
    rightView.show();
    rightView.destroyPage = box.destroy;

    if (isNew) inputTitle.input.inputElement.focus();

    return endObject(box);

};

ContentEditor.KEY = "ContentEditor";

// *** STATIC: STYLE AND HELPERS

ContentsPage.DAY = 24 * 60 * 60 * 1000;
ContentsPage.SITE_URL = "https://mysite.com";

ContentsPage.STYLE = {
    CARD_COLOR: T.surface,
    CARD_BORDER_COLOR: Ink(0.1),
    FIELD_COLOR: T.surface2,
    PRIMARY_COLOR: T.primary,
    ACCENT_COLOR: T.accent,
    ERROR_COLOR: T.danger,
};

// path: The start of the URL on the site
ContentsPage.TYPES = {
    page: { label: "Page", plural: "Pages", path: "/" },
    post: { label: "Post", plural: "Posts", path: "/blog/" },
    banner: { label: "Banner", plural: "Banners", path: "/banners/" },
};

ContentsPage.STATUSES = {
    published: { label: "Published", color: T.accent },
    draft: { label: "Draft", color: Theme.readable("#A9A79F") },
    scheduled: { label: "Scheduled", color: T.info },
    archived: { label: "Archived", color: "#8A6F5C" },
};

ContentsPage.CATEGORIES = ["News", "Guides", "Campaigns", "Company"];
ContentsPage.PLACEMENTS = ["Home (top)", "Home (middle)", "Shop (sidebar)", "Checkout"];

ContentsPage.CONTEXT_MENU_STYLE = {
    menu: { color: T.surface, border: 1, borderColor: Ink(0.14), round: 8, padding: 4, shadow: "0px 8px 24px " + Black(0.5) },
    item: { textColor: Ink(0.85) },
    itemHover: { textColor: Ink(0.95), color: Ink(0.08) },
    separator: { color: Ink(0.1) },
};

ContentsPage.DATE_STYLE = {
    field: { color: T.surface2, border: 1, borderColor: Ink(0.1), round: 8 },
    fieldHover: { borderColor: Ink(0.3) },
    fieldFocus: { borderColor: T.accent },
    fieldText: { fontSize: 14, textColor: Ink(0.9) },
    placeholder: { textColor: Ink(0.4) },
    icon: { color: Ink(0.55) },
    panel: { color: T.surface2, borderColor: Ink(0.12), shadow: "0 8px 24px " + Black(0.5) },
    title: { textColor: Ink(0.9) },
    arrow: { color: Ink(0.6), hoverColor: Ink(0.08) },
    weekDay: { textColor: Ink(0.45) },
    day: { textColor: Ink(0.85), hoverColor: Ink(0.08) },
    today: { borderColor: Ink(0.35) },
    selectedDay: { color: T.primary, textColor: Ink(1) },
    disabledDay: { textColor: Ink(0.2) },
    footerButton: { textColor: T.accent },
};

ContentsPage.TIME_STYLE = {
    field: { color: T.surface2, border: 1, borderColor: Ink(0.1), round: 8 },
    fieldHover: { borderColor: Ink(0.3) },
    fieldFocus: { borderColor: T.accent },
    fieldText: { fontSize: 14, textColor: Ink(0.9) },
    icon: { color: Ink(0.55) },
    panel: { color: T.surface2, borderColor: Ink(0.12), shadow: "0 8px 24px " + Black(0.5) },
    columnTitle: { textColor: Ink(0.45), activeTextColor: Ink(0.9) },
    cell: { textColor: Ink(0.85), hoverColor: Ink(0.08) },
    selectedCell: { color: T.primary, textColor: Ink(1) },
    disabledCell: { textColor: Ink(0.2) },
    footerButton: { textColor: T.accent },
};

ContentsPage.getStatusByLabel = function(label) {
    const id = Object.keys(ContentsPage.STATUSES).find(function(key) { return ContentsPage.STATUSES[key].label == label; });
    return (id) ? ContentsPage.STATUSES[id] : null;
};

ContentsPage.escapeHtml = function(text) {
    return String(text).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
};

// Local time: "2026-09-16 14:05" (sortable text)
ContentsPage.formatDateTime = function(time) {
    const d = new Date(time);
    const pad = function(n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
};

ContentsPage.cut = function(text, max) {
    return (text.length > max) ? text.slice(0, max - 1).trim() + "…" : text;
};

// "Çok Güzel Bir Başlık!" -> "cok-guzel-bir-baslik"
ContentsPage.slugify = function(text) {
    const map = { "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u", "ä": "a", "ß": "ss", "é": "e", "è": "e" };
    return String(text).toLowerCase().replace(/[çğıöşüâîûäßéè]/g, function(c) { return map[c]; })
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
};

ContentsPage.getUniqueSlug = function(slug, type) {
    let result = slug;
    for (let n = 2; ContentsPage.getContents().some(function(c) { return c.type == type && c.slug == result; }); n++) result = slug + "-" + n;
    return result;
};

ContentsPage.getUrl = function(content) {
    return ContentsPage.SITE_URL + ContentsPage.TYPES[content.type].path + (content.slug || "");
};

ContentsPage.countWords = function(text) {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    return words.length;
};

// [{ ok, text }]
ContentsPage.getSeoChecks = function(content) {
    const title = content.metaTitle || content.title;
    const description = content.metaDescription;
    const checks = [
        { ok: title.length >= 20 && title.length <= 60, text: "Title is 20-60 letters (" + title.length + ")" },
        { ok: description.length >= 70 && description.length <= 160, text: "Meta description is 70-160 letters (" + description.length + ")" },
        { ok: content.slug.length > 0 && content.slug.length <= 50, text: "URL is short (" + content.slug.length + " letters)" },
    ];
    if (content.type != "banner") checks.push({ ok: !!content.image, text: "Has a featured image" });
    if (content.type == "post") checks.push({ ok: ContentsPage.countWords(content.body) >= 300, text: "Post has at least 300 words (" + ContentsPage.countWords(content.body) + ")" });
    return checks;
};

// Images of the Media Library (if it is loaded)
ContentsPage.getImages = function() {
    if (typeof MediaPage === "undefined") return [];
    return MediaPage.getItems().filter(function(item) { return item.type == "image" && item.url; }).slice(0, 13);
};

// Active panel users (from the User List, if it is loaded)
ContentsPage.getAuthors = function() {
    if (typeof UserListPage !== "undefined") {
        return UserListPage.load().users.filter(function(user) { return user.status == "active"; }).map(function(user) { return user.name; });
    }
    return ["Bugra Ozden", "Deniz Arslan", "Ceren Aktas", "Zeynep Karaca"];
};

ContentsPage.getCurrentUserName = function() {
    return (typeof UserActionsPage !== "undefined") ? UserActionsPage.getCurrentUser().name : "You";
};

// params: { primary: 1, width }
ContentsPage.createButton = function(text, iconFile, onClick, params = {}) {
    const S = ContentsPage.STYLE;
    const btn = ButtonWithIcon({
        width: params.width || "auto",
        labelText: text,
        iconFile: iconFile || "",
        onClick: onClick,
        style: {
            layout: { gap: 8, padding: [14, 8] },
            icon: { width: 18, height: 18 },
            label: { fontSize: 14, textColor: Ink(0.92) },
            box: { color: (params.primary) ? S.PRIMARY_COLOR : S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 },
            hover: { color: (params.primary) ? T.primaryHover : T.surface3 },
            active: { color: (params.primary) ? T.primaryActive : T.surface4 },
        },
    });
    if (btn.icon) btn.icon.elem.style.filter = T.iconFilter; // WHY: Panel icons are black.
    return btn;
};

// selectedIndex: The first selected item
ContentsPage.createTinySelect = function(list, onSelect, selectedIndex = 0) {
    const S = ContentsPage.STYLE;
    let isReady = 0; // WHY: TinySelect calls onSelect when it is created.
    const select = TinySelect({
        list: list,
        selectedIndex: selectedIndex,
        height: 40,
        fontSize: 14,
        color: S.FIELD_COLOR,
        border: 1,
        borderColor: S.CARD_BORDER_COLOR,
        round: 8,
        labelBoldFont: 0,
        labelTextColor: Ink(0.9),
        arrowIcon: "../../comp-m2/tiny-select/arrow.svg",
        arrowSize: 18,
        invertIconColor: T.invertIcon,
        listFontSize: 14,
        listTextColor: Ink(0.85),
        listOverTextColor: S.ACCENT_COLOR,
        listBackgroundColor: S.FIELD_COLOR,
        listBorderColor: Ink(0.15),
        onSelect: function(index, id) {
            if (isReady) onSelect(id);
        },
    });
    isReady = 1;
    return select;
};

ContentsPage.getSmartTableStyle = function(libPath) {
    const S = ContentsPage.STYLE;
    return {
        scrollBarParams: {
            bar_border: 0, bar_round: 3, bar_borderColor: Ink(0.15), bar_width: 4, bar_mouseOverWidth: 4,
            bar_mouseOverColor: T.scrollBar, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2, bar_color: T.scrollBar,
            neverHide: 0, showDots: 0,
        },
        // WHY: Filtre kutusu ile alt bar aynı renkti, kutu görünmüyordu. Bar kart rengine, kutu ise alan rengine (FIELD_COLOR) alındı.
        searchInputParams: {
            width: "50%", height: 34, border: 1, round: 8, color: S.FIELD_COLOR, borderColor: S.CARD_BORDER_COLOR,
            borderBottomStyle: "1px solid " + S.CARD_BORDER_COLOR,
            textColor: Ink(0.9), placeholderColor: Ink(0.4), fontSize: 14,
            placeholderText: "Filter the table",
            searchIconSize: 15, searchIconOpacity: 0.55, invertIconColor: T.invertIcon,
            searchIconFile: libPath + "comp-m2/search-input-v2/filter.png",
            clearIconFile: libPath + "comp-m2/search-input-v2/clear.svg",
        },
        // Filtre kutusundaki sütun seçim listesi (ALL) de koyu tema ile açılsın.
        searchTitleMenuParams: {
            minWidth: 170,
            style: {
                menu: { color: S.FIELD_COLOR, border: 1, borderColor: Ink(0.12), round: 8, padding: 4, shadow: "0 8px 24px " + Black(0.5) },
                item: { height: 30, fontSize: 13, textColor: Ink(0.75), color: "transparent", round: 6, padding: 10, gap: 10 },
                itemHover: { textColor: "white", color: Ink(0.08) },
                disabled: { textColor: Ink(0.3), opacity: 0.4 },
                icon: { width: 14, height: 14 },
                separator: { color: Ink(0.1), space: 4 },
            },
        },
        style: {
            width: "100%",
            height: "100%",
            round: 8,
            line1Color: S.CARD_COLOR,
            line2Color: T.tableRow2,
            highlightItemCellColor: T.tableHighlight,
            highlightTitleCellColor: Ink(0.08),
            verticalScrollWidth: 20,
            verticalScrollMargin: 2,
            btnScrollDownIconFile: libPath + "comp-m3/smart-table/down.png",
            btnScrollUpIconFile: libPath + "comp-m3/smart-table/up.png",
            btnScrollCenterIconFile: libPath + "comp-m3/smart-table/scroll.png",
            sortIconFile: libPath + "comp-m3/smart-table/sort.png",
            // WHY: Varsayılan tik ikonu koyu renkli; koyu menüde görünmüyordu.
            searchTitleCheckIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + S.ACCENT_COLOR + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>'),
            loadingIconFile: libPath + "comp-m3/smart-table/clock.png",
            invertIconColor: T.invertIcon,
            box: { color: S.CARD_COLOR },
            boxBorder: { border: 1, borderColor: S.CARD_BORDER_COLOR },
            boxTitleLine: { color: S.FIELD_COLOR },
            boxTitleCell: { padding: [10, 0], borderRight: "1px solid " + Ink(0.06), borderBottom: "1px solid " + Ink(0.12) },
            lblTitleCell: { fontSize: 13, fontFamily: "opensans", textColor: Ink(0.6) },
            boxItemCell: { borderBottom: "1px solid " + Ink(0.05), borderRight: "1px solid " + Ink(0.03), padding: [10, 0] },
            lblItemCell: { fontSize: 14, textColor: Ink(0.75), fontFamily: "opensans" },
            boxInfoLine: { color: S.CARD_COLOR, borderTop: "1px solid " + Ink(0.08) },
            lblBoxInfoLine: { fontSize: 13, textColor: Ink(0.55) },
            lblNoDataFound: { color: T.surface3, textColor: Ink(0.6), padding: [8, 2], fontSize: 13, round: 8, border: 1, borderColor: Ink(0.15) },
            // Filtre kutusunun içindeki sütun etiketi: Kutunun içinde durduğu için daha hafif bir chip.
            lblSearchTitle: { color: Ink(0.08), textColor: Ink(0.6), padding: [8, 1], fontSize: 12, round: 6, border: 1, borderColor: Ink(0.14) },
            btnScrollCenter: { color: T.surface3, round: 100, borderColor: Ink(0.2), border: 1 },
            btnScrollUp: { color: T.surface4, round: 100, border: 1, borderColor: Ink(0.3) },
            btnScrollDown: { color: T.surface4, round: 100, border: 1, borderColor: Ink(0.3) },
            boxSort: { color: S.PRIMARY_COLOR },
        },
    };
};

// Opens the content in a new window, like it is on the site.
ContentsPage.openPreview = function(content) {

    const escape = ContentsPage.escapeHtml;

    // "## " lines are headings, empty lines split the paragraphs.
    const bodyHtml = String(content.body).split(/\n\s*\n/).map(function(block) {
        block = block.trim();
        if (!block) return "";
        if (block.startsWith("## ")) return "<h2>" + escape(block.slice(3)) + "</h2>";
        return "<p>" + escape(block).replace(/\n/g, "<br>") + "</p>";
    }).join("");

    const html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>" + escape(content.metaTitle || content.title) + "</title>" +
        "<style>body{font-family:Georgia,serif;color:#222;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.7}" +
        "img{width:100%;border-radius:10px;margin:16px 0}h1{font-family:system-ui,sans-serif;line-height:1.2}" +
        ".meta{font-family:system-ui,sans-serif;color:#888;font-size:14px}.bar{font-family:system-ui,sans-serif;background:#FFF4D6;color:#7A5A00;padding:8px 12px;border-radius:6px;font-size:13px}</style></head><body>" +
        "<div class='bar'>Preview · " + escape(ContentsPage.STATUSES[content.status].label) + " · " + escape(ContentsPage.getUrl(content)) + "</div>" +
        "<h1>" + escape(content.title || "Untitled") + "</h1>" +
        "<div class='meta'>" + escape(content.author) + ((content.type == "post") ? " · " + escape(content.category) : "") + "</div>" +
        ((content.image) ? "<img src='" + escape(content.image) + "' alt=''>" : "") +
        ((content.excerpt) ? "<p><i>" + escape(content.excerpt) + "</i></p>" : "") +
        bodyHtml + "</body></html>";

    const win = window.open("", "_blank");
    if (!win) return; // Pop-up blocked
    win.document.write(html);
    win.document.close();

};

// *** STATIC: CONTENT DATA (TEST)

ContentsPage._nextId = 1;
ContentsPage._contents = null;

ContentsPage.createEmptyContent = function(type) {
    return {
        id: 0,
        type: type,
        title: "",
        slug: "",
        excerpt: "",
        body: "",
        status: "draft",
        publishAt: 0,
        author: ContentsPage.getCurrentUserName(),
        image: "",
        metaTitle: "",
        metaDescription: "",
        showInMenu: 0, // Page
        category: ContentsPage.CATEGORIES[0], // Post
        tags: [], // Post
        link: "", // Banner
        placement: ContentsPage.PLACEMENTS[0], // Banner
        views: 0,
        updatedAt: Date.now(),
        updatedBy: ContentsPage.getCurrentUserName(),
    };
};

// Scheduled contents with a past time become published.
// TODO: Do this on your server (a scheduled job), not in the panel.
ContentsPage.publishDueContents = function() {
    const now = Date.now();
    ContentsPage.getContents().forEach(function(content) {
        if (content.status == "scheduled" && content.publishAt <= now) content.status = "published";
    });
};

// Contents of the site. Created one time and kept while the panel is open.
// TODO: Load the contents from your service.
ContentsPage.getContents = function() {

    if (ContentsPage._contents) return ContentsPage._contents;

    // Random numbers with a seed: the same test data every time. (mulberry32)
    let seed = 52017;
    const rnd = function() {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = function(list) { return list[Math.floor(rnd() * list.length)]; };

    const DAY = ContentsPage.DAY;
    const now = Date.now();
    const AUTHORS = ["Deniz Arslan", "Ceren Aktas", "Zeynep Karaca", "Bugra Ozden", "Selin Koc"];
    const images = ContentsPage.getImages().map(function(image) { return image.url; });

    const PARAGRAPH = "Choosing the right product is easier when you know what matters for you. In this text we explain the main points, " +
        "compare the popular options and share a few tips from our team. Read the details below and ask us if you have a question.";

    const makeBody = function(paragraphCount, headings) {
        const parts = [];
        for (let i = 0; i < paragraphCount; i++) {
            if (headings && i % 3 == 0) parts.push("## " + pick(["What to look for", "Our tips", "Compare the options", "Price and quality", "Final words"]));
            parts.push(PARAGRAPH);
        }
        return parts.join("\n\n");
    };

    // [type, title, status, days ago (or days later for scheduled), paragraphs]
    const DATA = [
        ["page", "About us", "published", 320, 4],
        ["page", "Contact", "published", 300, 1],
        ["page", "Shipping policy", "published", 210, 5],
        ["page", "Returns and refunds", "published", 205, 5],
        ["page", "Privacy policy", "published", 190, 8],
        ["page", "Terms of service", "published", 190, 9],
        ["page", "Careers", "draft", 12, 3],
        ["page", "Frequently asked questions", "published", 60, 7],
        ["page", "Store locations", "archived", 400, 2],
        ["post", "How to choose headphones", "published", 2, 22],
        ["post", "Summer sale: up to 40% off", "published", 18, 6],
        ["post", "5 tips for running in the heat", "published", 25, 18],
        ["post", "Smart watch buying guide 2026", "published", 40, 26],
        ["post", "Meet our new warehouse", "published", 55, 9],
        ["post", "How we pack your orders", "published", 70, 12],
        ["post", "Coffee mugs that keep it warm", "draft", 3, 8],
        ["post", "Back to school checklist", "scheduled", 4, 20],
        ["post", "Black Friday is coming", "scheduled", 40, 5],
        ["post", "Why we use recycled boxes", "published", 95, 14],
        ["post", "Desk setup ideas for small rooms", "published", 110, 24],
        ["post", "Our 2025 year in review", "archived", 260, 16],
        ["post", "New colors for the backpack", "published", 8, 7],
        ["post", "Care guide for running shoes", "draft", 1, 4],
        ["post", "Gift ideas under $50", "published", 130, 19],
        ["post", "How to clean your headphones", "published", 150, 11],
        ["post", "Behind the scenes: product photos", "draft", 6, 10],
        ["banner", "Summer sale hero", "published", 18, 1],
        ["banner", "Free shipping over $100", "published", 90, 1],
        ["banner", "Back to school", "scheduled", 4, 1],
        ["banner", "New smart watch", "published", 38, 1],
        ["banner", "Spring collection", "archived", 150, 1],
        ["banner", "Black Friday countdown", "draft", 2, 1],
    ];

    const list = DATA.map(function(item) {

        const type = item[0];
        const status = item[2];
        const isScheduled = (status == "scheduled");
        const time = (isScheduled) ? now + item[3] * DAY + Math.round(rnd() * 8) * 3600000 : now - item[3] * DAY - Math.round(rnd() * 20) * 3600000;
        const body = (type == "banner") ? pick(["Shop now", "Up to 40% off. This week only.", "Order today, get it tomorrow."]) : makeBody(item[4], type == "post");
        const hasSeo = rnd() < 0.7;

        const content = ContentsPage.createEmptyContent(type);
        Object.assign(content, {
            id: ContentsPage._nextId++,
            title: item[1],
            slug: ContentsPage.slugify(item[1]),
            excerpt: (type == "post") ? "A short summary of \"" + item[1] + "\" for the blog list." : "",
            body: body,
            status: status,
            publishAt: (status == "draft") ? 0 : time,
            author: pick(AUTHORS),
            image: (images.length && (type != "page" || rnd() < 0.3) && rnd() < 0.85) ? pick(images) : "",
            metaTitle: (hasSeo) ? item[1] + " | My Store" : "",
            metaDescription: (hasSeo) ? "Read \"" + item[1] + "\" on the My Store blog: tips, details and answers to the common questions of our customers." : "",
            showInMenu: (type == "page" && rnd() < 0.6) ? 1 : 0,
            category: (type == "post") ? pick(ContentsPage.CATEGORIES) : ContentsPage.CATEGORIES[0],
            tags: (type == "post") ? [pick(["audio", "fitness", "guide", "sale", "home", "news"]), pick(["tips", "2026", "gift", "office"])] : [],
            link: (type == "banner") ? pick(["/summer-sale", "/shop", "/blog/smart-watch-buying-guide-2026", "https://mysite.com/black-friday"]) : "",
            placement: (type == "banner") ? pick(ContentsPage.PLACEMENTS) : ContentsPage.PLACEMENTS[0],
            views: (status == "published" || status == "archived") ? Math.round((type == "post" ? 4000 : 9000) * rnd() * Math.min(1, item[3] / 60) + 30) : 0,
            updatedAt: (isScheduled) ? now - Math.round(rnd() * 3) * DAY : time + Math.round(rnd() * 3) * DAY * ((status == "draft") ? 0 : 1),
            updatedBy: pick(AUTHORS),
        });
        if (content.updatedAt > now) content.updatedAt = now - 3600000;

        return content;

    });

    ContentsPage._contents = list;
    return list;

};
