/* Bismillah */

/*

Media Library Page (Template) - v26.09

- Images, documents, videos and other files of the site: folders, search, filters, grid and list views,
  multi select (move, download, delete), upload and a details panel (right view).
- Test data: files are created one time and kept while the panel is open (MediaPage.getItems()).
  Image thumbnails are drawn with SVG, so no image files or internet are needed.
- Replace the "MEDIA SERVICE" functions with your service (Supabase Storage, S3, API...) calls.

COMPONENTS:
- Breadcrumbs (comp-m4): Folder path
- SearchInput (comp-m2): Search by name
- TinySelect (comp-m2): Type filter, sort, move to folder
- TextTabs (comp-m2): Grid / list view
- SelectFile (comp-m4): Upload
- CheckBox (comp-m3): Select files
- ContextMenu (comp-m4): File actions (right click or "•••")
- SmartTable (comp-m3): List view
- ButtonWithIcon, HoldToConfirmButton (comp-m3): Actions
- LineProgressBar (comp-m3): Storage usage
- InputB (comp-m2), Dialog, Waiting (comp-m2): Details panel, delete confirm, upload

*/

MediaPageDefaults = {
    color: "transparent",
};

const MediaPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, MediaPageDefaults, mainView);

    mainView.setKey(MediaPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";
    const S = MediaPage.STYLE;

    const PAGE_SIZE = 24; // Cards in the grid before "Load more"
    const STORAGE_QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB

    const TYPE_FILTERS = [
        { id: "", label: "All types" },
        { id: "image", label: "Images" },
        { id: "document", label: "Documents" },
        { id: "video", label: "Videos" },
        { id: "audio", label: "Audio" },
        { id: "archive", label: "Archives" },
    ];

    const SORTS = [
        { id: "newest", label: "Newest first" },
        { id: "name", label: "Name (A-Z)" },
        { id: "size", label: "Largest first" },
    ];

    // Current view
    const view = {
        folder: "", // "": All files
        type: "",
        search: "",
        sort: "newest",
        mode: "grid", // "grid", "list"
        shownCount: PAGE_SIZE,
    };

    const selectedIds = new Set();

    // Components
    let lblSubtitle, btnUpload;
    let uploadCard, uploadFile, uploadFolderSelect, btnStartUpload;
    let folderButtons = {};
    let storageBar, lblStorage, lblStorageTypes;
    let breadcrumbs, searchInput, typeSelect, sortSelect, viewTabs;
    let selectionBar, lblSelection, moveSelect, btnDeleteSelected;
    let grpGrid, btnLoadMore, grpList, smartTable, lblEmpty;
    let itemMenu;
    let cardList = []; // Cards in the grid

    // *** MEDIA SERVICE (TEST):

    const getItems = function() {
        return MediaPage.getItems();
    };

    const findItem = function(id) {
        return getItems().find(function(item) { return item.id == id; });
    };

    const deleteItems = function(ids) {
        // TODO: Delete the files with your service.
        const list = getItems();
        ids.forEach(function(id) {
            const index = list.findIndex(function(item) { return item.id == id; });
            if (index < 0) return;
            if (list[index].isObjectUrl) URL.revokeObjectURL(list[index].url);
            list.splice(index, 1);
            selectedIds.delete(id);
        });
    };

    const moveItems = function(ids, folder) {
        // TODO: Move the files with your service.
        ids.forEach(function(id) {
            const item = findItem(id);
            if (item) item.folder = folder;
        });
    };

    const uploadFiles = function(files, folder, onDone) {

        // TEST: Like an upload request
        if (typeof waiting !== "undefined") {
            waiting.setLabel("Uploading " + files.length + " file" + ((files.length > 1) ? "s" : "") + "...");
            waiting.show();
        }

        setTimeout(function() {

            // TODO: Upload file.file with your service, then use the returned url.
            files.forEach(function(file) {
                const type = MediaPage.getTypeByExtension(file.extension);
                const item = MediaPage.createItem({
                    name: file.name,
                    folder: folder,
                    size: file.size,
                    uploadedAt: Date.now(),
                    uploadedBy: "You",
                    isNew: 1,
                });
                if (type == "image") {
                    item.url = URL.createObjectURL(file.file);
                    item.isObjectUrl = 1;
                    // Real image size
                    const img = new Image();
                    img.onload = function() { item.width = img.naturalWidth; item.height = img.naturalHeight; };
                    img.src = item.url;
                }
                getItems().unshift(item);
            });

            if (typeof waiting !== "undefined") {
                waiting.hide();
                waiting.setLabel("");
                waiting.lbl.visible = 0;
            }

            onDone();

        }, 800);

    };

    // *** PRIVATE FUNCTIONS:

    const getVisibleItems = function() {

        const search = view.search.trim().toLowerCase();

        const list = getItems().filter(function(item) {
            if (view.folder && item.folder != view.folder) return false;
            if (view.type && item.type != view.type) return false;
            if (search && !(item.name.toLowerCase().includes(search) || item.alt.toLowerCase().includes(search))) return false;
            return true;
        });

        list.sort(function(a, b) {
            if (view.sort == "name") return a.name.localeCompare(b.name, "en");
            if (view.sort == "size") return b.size - a.size;
            return b.uploadedAt - a.uploadedAt;
        });

        return list;

    };

    const downloadItem = function(item) {
        const link = document.createElement("a");
        // TEST: Documents have no real file. A small text file is downloaded instead.
        const url = item.url || URL.createObjectURL(new Blob(["Test file: " + item.name], { type: "text/plain" }));
        link.href = url;
        link.download = item.name;
        link.click();
        if (!item.url) URL.revokeObjectURL(url);
    };

    const copyUrl = function(item) {
        navigator.clipboard.writeText(item.publicUrl);
    };

    const openFolder = function(folder) {
        view.folder = folder;
        view.shownCount = PAGE_SIZE;
        render();
    };

    const openDetails = function(item) {
        MediaDetails({
            item: item,
            folders: MediaPage.FOLDERS,
            onSave: function(item, changes) {
                // TODO: Save the changes with your service.
                Object.assign(item, changes);
                item.publicUrl = MediaPage.getPublicUrl(item);
                closeDetails();
                render();
            },
            onDelete: function(item) {
                deleteItems([item.id]);
                closeDetails();
                render();
            },
            onDownload: downloadItem,
            onCopyUrl: copyUrl,
        });
    };

    const closeDetails = function() {
        if (rightView.isShown(MediaDetails.KEY)) {
            rightView.hide();
            rightView.clean();
        }
    };

    // WHY: The "Select" text depends on the file. Items are set before opening (setItems() closes an open menu).
    const openItemMenu = function(event, card) {
        const isSelected = selectedIds.has(card.item.id);
        itemMenu.setItems([
            { text: "Open details", key: "open" },
            { text: "Copy URL", key: "copy" },
            { text: "Download", key: "download" },
            "-",
            { text: (isSelected) ? "Unselect" : "Select", key: "select" },
            "-",
            { text: "Delete...", key: "delete" },
        ]);
        itemMenu.openWithEvent(event, card);
    };

    const confirmDelete = function(ids) {
        const text = (ids.length == 1) ? "<b>" + findItem(ids[0]).name + "</b>" : "<b>" + ids.length + " files</b>";
        Dialog({
            icon: ASSETS + "warning.png",
            title: "Delete Files",
            desc: text + " will be deleted. Pages that use them will show a broken image.",
            confirmButtonText: "Delete",
            confirmButtonColor: S.ERROR_COLOR,
            callback: function(isConfirmed) {
                if (!isConfirmed || !box) return;
                deleteItems(ids);
                render();
            },
        });
    };

    // *** RENDER:

    const render = function() {

        const all = getItems();
        const list = getVisibleItems();

        // Prune the selection (deleted files)
        selectedIds.forEach(function(id) { if (!findItem(id)) selectedIds.delete(id); });

        // Header
        const totalSize = all.reduce(function(sum, item) { return sum + item.size; }, 0);
        lblSubtitle.text = all.length + " files · " + MediaPage.formatSize(totalSize);

        // Breadcrumbs
        const items = [{ text: "Media Library", key: "" }];
        if (view.folder) items.push({ text: view.folder, key: view.folder });
        breadcrumbs.setItems(items, 1);

        renderFolders();
        renderStorage(totalSize);
        renderSelectionBar();

        grpGrid.visible = (view.mode == "grid") ? 1 : 0;
        grpList.visible = (view.mode == "list") ? 1 : 0;

        if (view.mode == "grid") {
            renderGrid(list);
        } else {
            btnLoadMore.visible = 0;
            smartTable.setItemDataList(list.map(function(item) {
                return {
                    id: item.id,
                    name: item.name,
                    folder: item.folder,
                    type: MediaPage.TYPES[item.type].label,
                    size: item.size,
                    uploaded: MediaPage.formatSortableDate(item.uploadedAt), // "2026-09-16 14:05" (local time, sortable text)
                };
            }));
        }

        lblEmpty.visible = (list.length == 0) ? 1 : 0;
        lblEmpty.text = (view.search || view.type) ? "No files match the filters." : "This folder is empty. Upload files to add them.";

    };

    const renderFolders = function() {

        const all = getItems();

        [""].concat(MediaPage.FOLDERS).forEach(function(folder) {

            const btn = folderButtons[folder];
            const count = (folder) ? all.filter(function(item) { return item.folder == folder; }).length : all.length;
            const isSelected = (view.folder == folder);

            btn.setText((folder || "All files") + " <span style='opacity:0.45'>" + count + "</span>");
            // WHY: ButtonWithIcon uses style.box.color on mouse out. Change it too, so the selection stays.
            btn.style.box.color = (isSelected) ? S.SELECTED_COLOR : "transparent";
            btn.color = btn.style.box.color;

        });

    };

    const renderStorage = function(totalSize) {

        const percent = Math.min(100, totalSize / STORAGE_QUOTA * 100);
        storageBar.setProgress(percent);
        lblStorage.text = MediaPage.formatSize(totalSize) + " of " + MediaPage.formatSize(STORAGE_QUOTA) + " used";

        const lines = Object.keys(MediaPage.TYPES).map(function(type) {
            const size = getItems().filter(function(item) { return item.type == type; }).reduce(function(sum, item) { return sum + item.size; }, 0);
            if (!size) return "";
            return "<span style='color:" + MediaPage.TYPES[type].color + "'>●</span> " + MediaPage.TYPES[type].label + ": " + MediaPage.formatSize(size);
        }).filter(Boolean);
        lblStorageTypes.text = lines.join("<br>");

    };

    const renderSelectionBar = function() {
        const count = selectedIds.size;
        selectionBar.visible = (count > 0) ? 1 : 0;
        lblSelection.text = count + " file" + ((count > 1) ? "s" : "") + " selected";
    };

    const renderGrid = function(list) {

        // Remove old cards
        cardList.forEach(function(card) {
            card.checkBox.remove();
            card.remove();
        });
        cardList = [];

        // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. After the endGroup() of the first card,
        // the next cards were created in another container. Cards are created, then moved into the grid.
        list.slice(0, view.shownCount).forEach(function(item) {
            const card = createCard(item);
            grpGrid.add(card);
            cardList.push(card);
        });

        btnLoadMore.visible = (list.length > view.shownCount) ? 1 : 0;
        btnLoadMore.setText("Load more (" + (list.length - view.shownCount) + ")");

    };

    const createCard = function(item) {

        const isSelected = selectedIds.has(item.id);
        const typeInfo = MediaPage.TYPES[item.type];

        const card = VGroup({
            width: "auto",
            height: "auto",
            align: "left top",
            gap: 0,
            color: S.CARD_COLOR,
            border: 1,
            borderColor: (isSelected) ? S.ACCENT_COLOR : S.CARD_BORDER_COLOR,
            round: 10,
            clipContent: 1,
        });
        // WHY: The grid container uses "display: grid". basic.js makes objects relative only in flex containers.
        card.position = "relative";
        card.elem.style.cursor = "pointer";
        card.setMotion("border-color 0.15s, transform 0.15s");
        card.item = item;

            // THUMBNAIL
            const thumb = HGroup({ width: "100%", height: 130, align: "center center", color: MediaPage.alpha(typeInfo.color, 0.12) });

                if (item.url) {
                    Icon({ width: "100%", height: "100%" });
                    that.load(item.url);
                    that.elem.style.objectFit = "cover";
                    that.elem.alt = item.alt || item.name;
                } else {
                    Label({
                        text: item.extension.toUpperCase(),
                        fontSize: 22,
                        textColor: typeInfo.color,
                        padding: [12, 6],
                        border: 2,
                        borderColor: MediaPage.alpha(typeInfo.color, 0.5),
                        round: 8,
                    });
                    that.elem.style.fontFamily = "opensans-bold";
                }

            endGroup();

            // CHECKBOX: Select (left top)
            card.checkBox = CheckBox({
                checked: (isSelected) ? 1 : 0,
                style: {
                    layout: { padding: [0, 0] },
                    mark: { width: 22, height: 22, color: Black(0.45), borderColor: Ink(0.7) },
                    checkedMark: { color: S.PRIMARY_COLOR, borderColor: Ink(0.9) },
                    hoverMark: { borderColor: Ink(1) },
                    tick: { color: Ink(1) },
                },
                onChange: function(self) {
                    if (self.checked) selectedIds.add(item.id);
                    else selectedIds.delete(item.id);
                    card.borderColor = (self.checked) ? S.ACCENT_COLOR : S.CARD_BORDER_COLOR;
                    renderSelectionBar();
                },
            });
            card.checkBox.position = "absolute";
            card.checkBox.left = 10;
            card.checkBox.top = 10;

            // LABEL: New (right top)
            if (item.isNew) {
                Label({ text: "NEW", fontSize: 11, textColor: Ink(1), color: S.PRIMARY_COLOR, round: 6, padding: [8, 3] });
                that.position = "absolute";
                that.right = 10;
                that.top = 10;
            }

            // INFO
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 4, padding: [12, 10] });

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                that.elem.style.flex = "1 1 auto";
                that.elem.style.minWidth = "0";

                    Label({ text: item.name, fontSize: 14, textColor: Ink(0.9), width: "100%" });
                    that.elem.style.whiteSpace = "nowrap";
                    that.elem.style.overflow = "hidden";
                    that.elem.style.textOverflow = "ellipsis";
                    that.elem.title = item.name;

                    Label({ text: MediaPage.formatSize(item.size) + " · " + typeInfo.label, fontSize: 12, textColor: Ink(0.45) });

                endGroup();

                // BUTTON: More actions
                card.btnMore = Label({
                    text: "•••",
                    fontSize: 12,
                    textColor: Ink(0.6),
                    padding: [8, 4],
                    round: 6,
                    clickable: 1,
                });
                card.btnMore.elem.style.cursor = "pointer";
                card.btnMore.elem.setAttribute("aria-label", "More actions");
                card.btnMore.on("mouseover", function(self) { self.color = Ink(0.08); });
                card.btnMore.on("mouseout", function(self) { self.color = "transparent"; });
                card.btnMore.item = item;

            endGroup();

        endGroup();

        card.on("mouseover", function() { card.elem.style.transform = "translateY(-2px)"; });
        card.on("mouseout", function() { card.elem.style.transform = "translateY(0px)"; });

        card.on("click", function(self, event) {
            // WHY: Clicks on the check box and the "•••" button are not a card click.
            if (card.checkBox.elem.contains(event.target) || card.btnMore.elem.contains(event.target)) return;
            openDetails(item);
        });

        card.on("contextmenu", function(self, event) {
            event.preventDefault(); // WHY: Do not show the browser menu.
            openItemMenu(event, card);
        });
        card.btnMore.on("click", function(self, event) {
            openItemMenu(event, card);
        });

        return card;

    };

    // *** VIEW HELPERS:

    const setFlex = function(obj, flex) {
        obj.elem.style.flex = flex;
        obj.elem.style.minWidth = "0";
    };

    const startCard = function(params = {}) {
        return VGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 12,
            padding: 16,
            color: S.CARD_COLOR,
            border: 1,
            borderColor: S.CARD_BORDER_COLOR,
            round: 12,
            ...params,
        });
    };

    const createSmallTitle = function(text) {
        Label({ text: text.toUpperCase(), fontSize: 11, textColor: Ink(0.45) });
        that.elem.style.letterSpacing = "1px";
    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {

        closeDetails();

        // WHY: These components have objects or events on the page. box.remove() does not remove them.
        cardList.forEach(function(card) { card.checkBox.remove(); });
        if (itemMenu) itemMenu.remove();
        if (uploadFile) uploadFile.remove();
        if (smartTable) smartTable.remove();
        if (breadcrumbs) breadcrumbs.remove();

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    const initHeader = function() {

        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.flexWrap = "wrap";
        that.elem.style.justifyContent = "space-between";

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                Label({ text: "Media Library", fontSize: 26, textColor: Ink(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                lblSubtitle = Label({ text: "", fontSize: 14, textColor: Ink(0.5) });

            endGroup();

            btnUpload = MediaPage.createButton("Upload Files", ASSETS + "top-bar/add.png", function() {
                const show = !uploadCard.visible;
                uploadCard.visible = (show) ? 1 : 0;
                btnUpload.setText((show) ? "Close Upload" : "Upload Files");
            }, { primary: 1 });

        endGroup();

    };

    const initUploadCard = function() {

        uploadCard = startCard({ gap: 14 });

            HGroup({ width: "100%", height: "auto", align: "left center" });
            that.elem.style.justifyContent = "space-between";

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                    Label({ text: "Upload Files", fontSize: 16, textColor: Ink(0.95) });
                    that.elem.style.fontFamily = "opensans-bold";
                    Label({ text: "Images, videos, audio, PDF, Office and ZIP files. Max 20 MB each, 10 files at once.", fontSize: 12, textColor: Ink(0.45) });
                endGroup();

            endGroup();

            uploadFile = SelectFile({
                width: "100%",
                zoneHeight: 140,
                multiple: 1,
                maxFiles: 10,
                maxSize: 20 * 1024 * 1024,
                accept: "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip",
                titleText: "Drag and drop files here",
                descText: "or click to select",
                style: MediaPage.SELECT_FILE_STYLE,
                onChange: function(self) {
                    btnStartUpload.setText("Upload " + self.files.length + " file" + ((self.files.length == 1) ? "" : "s"));
                    btnStartUpload.elem.inert = (self.files.length == 0);
                    btnStartUpload.opacity = (self.files.length) ? 1 : 0.4;
                },
            });

            HGroup({ width: "100%", height: "auto", align: "right center", gap: 10 });
            that.elem.style.flexWrap = "wrap";

                Label({ text: "Upload to", fontSize: 14, textColor: Ink(0.6) });

                uploadFolderSelect = MediaPage.createTinySelect(
                    MediaPage.FOLDERS.map(function(folder) { return { id: folder, label: folder }; }),
                    function() { }
                );

                btnStartUpload = MediaPage.createButton("Upload 0 files", "", function() {
                    const files = uploadFile.getFiles();
                    if (!files.length) return;
                    const folder = uploadFolderSelect.list[uploadFolderSelect.selectedIndex].id;
                    uploadFiles(files, folder, function() {
                        if (!box) return;
                        uploadFile.clear();
                        uploadCard.visible = 0;
                        btnUpload.setText("Upload Files");
                        view.folder = folder;
                        view.sort = "newest";
                        sortSelect.setSelectedIndex(0);
                        render();
                    });
                }, { primary: 1 });
                btnStartUpload.elem.inert = true;
                btnStartUpload.opacity = 0.4;

            endGroup();

        endGroup();

    };

    const initSidebar = function() {

        const sidebar = VGroup({ width: "auto", height: "auto", align: "left top", gap: 16 });
        setFlex(sidebar, "0 0 240px");

            startCard({ gap: 4, padding: 8 });

                HGroup({ width: "100%", height: "auto", align: "left center", padding: [8, 6] });
                    createSmallTitle("Folders");
                endGroup();

                [""].concat(MediaPage.FOLDERS).forEach(function(folder) {
                    folderButtons[folder] = ButtonWithIcon({
                        width: "100%",
                        labelText: folder || "All files",
                        iconFile: "",
                        onClick: function() { openFolder(folder); },
                        style: {
                            layout: { gap: 8, padding: [10, 8], align: "left center" },
                            label: { fontSize: 14, textColor: Ink(0.9) },
                            box: { color: "transparent", border: 0, round: 8 },
                            hover: { color: Ink(0.06) },
                            active: { color: Ink(0.1) },
                        },
                    });
                });

            endGroup();

            startCard({ gap: 10 });

                createSmallTitle("Storage");

                lblStorage = Label({ text: "", fontSize: 14, textColor: Ink(0.9) });

                storageBar = LineProgressBar({
                    width: 204,
                    height: 14,
                    progress: 0,
                    // WHY: LineProgressBar is made for light backgrounds (the current line is black).
                    // On the dark themes the bar is inverted, so the colors are given inverted too.
                    primaryColor: (T.isDark) ? MediaPage.invertColor(S.ACCENT_COLOR) : S.ACCENT_COLOR,
                    secondaryColor: (T.isDark) ? MediaPage.invertColor(T.surface4) : T.surface4,
                });
                storageBar.elem.style.filter = T.iconFilter;
                storageBar.elem.style.margin = "4px 0px";

                lblStorageTypes = Label({ text: "", fontSize: 12, textColor: Ink(0.55) });
                that.elem.style.lineHeight = "20px";

            endGroup();

        endGroup();

    };

    const initToolbar = function() {

        startCard({ gap: 12 });

            breadcrumbs = Breadcrumbs({
                items: [{ text: "Media Library", key: "" }],
                onClick: function(self, item) {
                    openFolder(item.key);
                },
                style: {
                    item: { fontSize: 15, textColor: Ink(0.55) },
                    itemHover: { textColor: Ink(0.95), color: Ink(0.08) },
                    current: { textColor: Ink(0.95) },
                    separator: { textColor: Ink(0.3) },
                    focus: { color: S.ACCENT_COLOR },
                },
            });

            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.flexWrap = "wrap";

                searchInput = SearchInput({
                    width: 260,
                    height: 40,
                    border: 1,
                    borderColor: S.CARD_BORDER_COLOR,
                    borderBottomStyle: "1px solid " + S.CARD_BORDER_COLOR,
                    round: 8,
                    color: S.FIELD_COLOR,
                    textColor: Ink(0.9),
                    fontSize: 14,
                    searchIconSize: 16,
                    placeholderText: "Search files",
                    invertIconColor: T.invertIcon,
                    searchIconFile: LIB_PATH + "comp-m2/search-input-v2/search.svg",
                    clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    onSearch: function(text) {
                        view.search = text;
                        view.shownCount = PAGE_SIZE;
                        render();
                    },
                });
                searchInput.position = "relative";

                typeSelect = MediaPage.createTinySelect(TYPE_FILTERS, function(index, id) {
                    if (!box || !lblEmpty) return; // Called on create
                    view.type = id;
                    view.shownCount = PAGE_SIZE;
                    render();
                });

                sortSelect = MediaPage.createTinySelect(SORTS, function(index, id) {
                    if (!box || !lblEmpty) return; // Called on create
                    view.sort = id;
                    render();
                });

                // Space
                HGroup({ width: "auto", height: 1 });
                that.elem.style.flex = "1 1 auto";
                endGroup();

                viewTabs = TextTabs({
                    tabHeight: 40, // The same height as the buttons / inputs next to it
                    tabList: ["Grid", "List"],
                    onClick: function(self) {
                        view.mode = (self.index == 0) ? "grid" : "list";
                        render();
                    },
                    backgroundStyle: { colorBottom: S.FIELD_COLOR, colorTop: S.FIELD_COLOR, round: 8, border: 1, borderColor: S.CARD_BORDER_COLOR },
                    tabPadding: [3, 3],
                    labelStyle: { fontSize: 14, textColor: Ink(0.85), padding: [14, 6] },
                    selectedStyle: { color: S.PRIMARY_COLOR, round: 6 },
                });

            endGroup();

        endGroup();

    };

    const initSelectionBar = function() {

        selectionBar = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: 10,
            padding: [16, 10],
            color: T.tableHighlight,
            border: 1,
            borderColor: MediaPage.alpha(S.ACCENT_COLOR, 0.4),
            round: 12,
        });
        that.elem.style.flexWrap = "wrap";

            lblSelection = Label({ text: "", fontSize: 14, textColor: Ink(0.95) });
            that.elem.style.fontFamily = "opensans-bold";

            MediaPage.createButton("Clear", "", function() {
                selectedIds.clear();
                render();
            });

            // Space
            HGroup({ width: "auto", height: 1 });
            that.elem.style.flex = "1 1 auto";
            endGroup();

            moveSelect = MediaPage.createTinySelect(
                [{ id: "", label: "Move to..." }].concat(MediaPage.FOLDERS.map(function(folder) { return { id: folder, label: folder }; })),
                function(index, id) {
                    if (!id || !box || !lblEmpty) return;
                    moveItems(Array.from(selectedIds), id);
                    selectedIds.clear();
                    moveSelect.setSelectedIndex(0); // Back to "Move to..."
                    render();
                }
            );

            MediaPage.createButton("Download", ASSETS + "arrow_down.png", function() {
                selectedIds.forEach(function(id) { downloadItem(findItem(id)); });
            });

            btnDeleteSelected = MediaPage.createHoldToDelete(function() {
                deleteItems(Array.from(selectedIds));
                render();
            });

        endGroup();

    };

    const initContent = function() {

        // GRID
        grpGrid = HGroup({ width: "100%", height: "auto", align: "left top" });
        grpGrid.elem.style.display = "grid";
        grpGrid.elem.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
        grpGrid.elem.style.gap = "14px";
        endGroup();

        btnLoadMore = MediaPage.createButton("Load more", "", function() {
            view.shownCount += PAGE_SIZE;
            render();
        }, { width: "100%" });

        // LIST
        grpList = HGroup({ width: "100%", height: 600, align: "left top" });

            smartTable = SmartTable({
                titleDataList: [
                    { name: "NAME", dataTitle: "name", dataType: "string", width: 280, shortable: 1 },
                    { name: "FOLDER", dataTitle: "folder", dataType: "string", width: 130, shortable: 1 },
                    { name: "TYPE", dataTitle: "type", dataType: "string", width: 120, shortable: 1 },
                    { name: "SIZE", dataTitle: "size", dataType: "integer", width: 110, shortable: 1 },
                    { name: "UPLOADED", dataTitle: "uploaded", dataType: "string", width: 170, shortable: 1 },
                ],
                itemDataList: [],
                titleHeight: 44,
                itemHeight: 40,
                infoHeight: 56,
                itemLineCount: 12,
                sortByTitleIndex: 4,
                sortDirection: "Z-A",
                onSelect: function(itemData) {
                    const item = findItem(itemData.id);
                    if (item) openDetails(item);
                },
                // WHY: SmartTable writes the raw value (sizes sort as numbers). The size text is written here.
                updateCustomItemCell: function(cell, titleDataIndex, data) {
                    if (titleDataIndex == 3 && data !== "") cell.label.text = MediaPage.formatSize(data);
                },
                ...MediaPage.getSmartTableStyle(LIB_PATH, "Filter the list"),
            });

        endGroup();

        lblEmpty = Label({
            text: "",
            width: "100%",
            fontSize: 14,
            textColor: Ink(0.5),
            textAlign: "center",
            padding: [16, 40],
            border: 1,
            borderColor: S.CARD_BORDER_COLOR,
            round: 12,
        });
        lblEmpty.elem.style.borderStyle = "dashed";

    };

    const initItemMenu = function() {

        // MENU: File actions (items: openItemMenu)
        itemMenu = ContextMenu({
            onClick: function(self, menuItem) {
                const item = self.source.item;
                switch (menuItem.key) {
                    case "open": openDetails(item); break;
                    case "copy": copyUrl(item); break;
                    case "download": downloadItem(item); break;
                    case "select":
                        if (selectedIds.has(item.id)) selectedIds.delete(item.id);
                        else selectedIds.add(item.id);
                        render();
                        break;
                    case "delete": confirmDelete([item.id]); break;
                }
            },
            style: MediaPage.CONTEXT_MENU_STYLE,
        });

    };

    // *** PAGE INIT CODE:

    initItemMenu();

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
            initUploadCard();

            HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
            that.elem.style.flexWrap = "wrap";

                initSidebar();

                // MAIN
                const main = VGroup({ width: "auto", height: "auto", align: "left top", gap: 14 });
                setFlex(main, "1 1 520px");

                    initToolbar();
                    initSelectionBar();
                    initContent();

                endGroup();

            endGroup();

        endGroup();

    endBox();

    // WHY: Hidden after the content is created. Objects created in a hidden (display: none) group are not flex items.
    uploadCard.visible = 0;
    selectionBar.visible = 0;

    render();

    return box.endPage();

};

MediaPage.KEY = "Media";

// *** DETAILS PANEL (RIGHT VIEW):

const MediaDetailsDefaults = {
    item: null,
    folders: [],
    onSave: function(item, changes) {},
    onDelete: function(item) {},
    onDownload: function(item) {},
    onCopyUrl: function(item) {},
};

const MediaDetails = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, MediaDetailsDefaults);

    // Edit params, if needed:
    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = T.surfaceDeep;

    // WHY: item is a live object of the list. startObject() would copy it.
    const item = params.item;

    // BOX: Component container
    let box = startObject(params);

    const S = MediaPage.STYLE;
    const typeInfo = MediaPage.TYPES[item.type];
    let inputName, inputAlt, folderSelect;

    box.destroy = function() {
        box.remove();
        box = null;
    };

    // *** VIEW:

    const INPUT_PARAMS = {
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
    };

    // WHY: InputB has fixed text colors for light backgrounds.
    const styleInput = function(input) {
        input.title.textColor = Ink(0.45);
        input.title.fontSize = 11;
        input.title.elem.style.letterSpacing = "1px";
        input.input.textColor = Ink(0.9);
        input.input.fontSize = 15;
        input.input.height = 32;
        input.warningBall.borderColor = S.CARD_COLOR;
        return input;
    };

    // Left line
    Box(0, 0, 1, "100%", { color: Ink(0.12) });

    // GROUP: Scrollable content
    startBox(0, 0, "100%", "calc(100% - 76px)", { color: "transparent", scrollY: 1 });

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 16, padding: 20 });

            // Title
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
            that.elem.style.justifyContent = "space-between";

                Label({ text: "File Details", fontSize: 18, textColor: Ink(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                Icon({ width: 28, height: 28, clickable: 1 });
                that.load("assets/close.png");
                that.elem.style.filter = T.iconFilter;
                that.elem.style.cursor = "pointer";
                that.opacity = 0.6;
                that.on("click", function() {
                    rightView.hide();
                    rightView.clean();
                });

            endGroup();

            // Preview
            HGroup({ width: "100%", height: 220, align: "center center", color: MediaPage.alpha(typeInfo.color, 0.12), round: 10, clipContent: 1 });

                if (item.url) {
                    Icon({ width: "100%", height: "100%" });
                    that.load(item.url);
                    that.elem.style.objectFit = "contain";
                    that.elem.alt = item.alt || item.name;
                } else {
                    Label({ text: item.extension.toUpperCase(), fontSize: 34, textColor: typeInfo.color, padding: [18, 8], border: 2, borderColor: MediaPage.alpha(typeInfo.color, 0.5), round: 10 });
                    that.elem.style.fontFamily = "opensans-bold";
                }

            endGroup();

            // Fields
            inputName = styleInput(InputB({
                ...INPUT_PARAMS,
                titleText: "FILE NAME",
                inputValue: item.name, // WHY: Created with the value, so the required warning ball is not shown.
                isRequired: 1,
                requiredText: "File name is required",
                maxChar: 80,
            }));

            if (item.type == "image") {
                inputAlt = styleInput(InputB({
                    ...INPUT_PARAMS,
                    titleText: "ALT TEXT",
                    inputValue: item.alt,
                    placeholder: "Describe the image (for accessibility and SEO)",
                    maxChar: 140,
                }));
            }

            VGroup({ width: "100%", height: "auto", align: "left top", gap: 8 });
                Label({ text: "FOLDER", fontSize: 11, textColor: Ink(0.45) });
                that.elem.style.letterSpacing = "1px";
                folderSelect = MediaPage.createTinySelect(
                    box.folders.map(function(folder) { return { id: folder, label: folder }; }),
                    function() { }
                );
                folderSelect.setSelectedIndex(Math.max(0, box.folders.indexOf(item.folder)));
            endGroup();

            // Information
            const INFO = [
                ["Type", typeInfo.label + " (." + item.extension + ")"],
                ["Size", MediaPage.formatSize(item.size)],
                ["Dimensions", (item.width) ? item.width + " × " + item.height + " px" : "—"],
                ["Uploaded", new Date(item.uploadedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })],
                ["Uploaded by", item.uploadedBy],
            ];

            VGroup({ width: "100%", height: "auto", align: "left top", gap: 0 });

                INFO.forEach(function(info, index) {
                    HGroup({ width: "100%", height: "auto", align: "left center", padding: [0, 8] });
                    that.elem.style.justifyContent = "space-between";
                    if (index > 0) that.elem.style.borderTop = "1px solid " + Ink(0.06);
                        Label({ text: info[0], fontSize: 13, textColor: Ink(0.5) });
                        Label({ text: info[1], fontSize: 13, textColor: Ink(0.9) });
                    endGroup();
                });

            endGroup();

            // URL
            VGroup({ width: "100%", height: "auto", align: "left top", gap: 8 });

                Label({ text: "PUBLIC URL", fontSize: 11, textColor: Ink(0.45) });
                that.elem.style.letterSpacing = "1px";

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });

                    Label({ text: item.publicUrl, fontSize: 12, textColor: Ink(0.75), color: S.FIELD_COLOR, round: 8, padding: [10, 10], border: 1, borderColor: S.CARD_BORDER_COLOR });
                    that.elem.style.fontFamily = "monospace";
                    that.elem.style.whiteSpace = "nowrap";
                    that.elem.style.overflow = "hidden";
                    that.elem.style.textOverflow = "ellipsis";
                    that.elem.style.flex = "1 1 auto";
                    that.elem.style.minWidth = "0";

                    const btnCopy = MediaPage.createButton("Copy", "", function() {
                        box.onCopyUrl(item);
                        btnCopy.setText("Copied");
                        setTimeout(function() { if (box) btnCopy.setText("Copy"); }, 1500);
                    });

                endGroup();

            endGroup();

        endGroup();

    endBox();

    // GROUP: Buttons (bottom)
    HGroup({ left: 0, bottom: 0, width: "100%", height: 76, align: "left center", gap: 8, padding: [20, 0] });
    that.elem.style.borderTop = "1px solid " + Ink(0.08);

        MediaPage.createHoldToDelete(function() {
            box.onDelete(item);
        });

        // Space
        HGroup({ width: "auto", height: 1 });
        that.elem.style.flex = "1 1 auto";
        endGroup();

        MediaPage.createButton("Download", "", function() {
            box.onDownload(item);
        });

        MediaPage.createButton("Save", "", function() {
            const name = inputName.getInputValue().trim();
            if (!name) {
                inputName.checkIfInputIsRequiredAndEmpty();
                return;
            }
            box.onSave(item, {
                name: name,
                extension: MediaPage.getExtension(name) || item.extension,
                alt: (inputAlt) ? inputAlt.getInputValue().trim() : item.alt,
                folder: folderSelect.list[folderSelect.selectedIndex].id,
            });
        }, { primary: 1 });

    endGroup();

    // *** INIT CODE:

    rightView.clean();
    rightView.setKey(MediaDetails.KEY);
    rightView.setWidth(440);
    rightView.add(box);
    rightView.show();
    rightView.destroyPage = box.destroy;

    return endObject(box);

};

MediaDetails.KEY = "MediaDetails";

// *** STATIC: STYLE AND COMPONENT HELPERS

MediaPage.STYLE = {
    CARD_COLOR: T.surface,
    CARD_BORDER_COLOR: Ink(0.1),
    FIELD_COLOR: T.surface2,
    PRIMARY_COLOR: T.primary,
    ACCENT_COLOR: T.accent,
    SELECTED_COLOR: "rgba(101, 162, 147, 0.18)",
    ERROR_COLOR: T.danger,
};

MediaPage.TYPES = {
    image: { label: "Image", color: T.info },
    document: { label: "Document", color: T.warning },
    video: { label: "Video", color: "#D55181" },
    audio: { label: "Audio", color: "#9085E9" },
    archive: { label: "Archive", color: "#898781" },
};

MediaPage.CONTEXT_MENU_STYLE = {
    menu: { color: T.surface2, borderColor: Ink(0.12), shadow: "0px 8px 24px " + Black(0.5) },
    item: { textColor: Ink(0.85) },
    itemHover: { textColor: Ink(1), color: Ink(0.08) },
    disabled: { textColor: Ink(0.3) },
    separator: { color: Ink(0.1) },
};

MediaPage.SELECT_FILE_STYLE = {
    zone: { color: T.surface2, border: 2, borderColor: Ink(0.12), round: 10 },
    zoneHover: { color: T.surface3, borderColor: Ink(0.3) },
    zoneDragOver: { color: T.tableHighlight, borderColor: T.accent },
    icon: { color: Ink(0.45), dragOverColor: T.accent },
    title: { fontSize: 15, textColor: Ink(0.9) },
    desc: { fontSize: 13, textColor: Ink(0.5) },
    hint: { textColor: Ink(0.4) },
    item: { color: T.surface2, borderColor: Ink(0.1) },
    itemName: { textColor: Ink(0.85) },
    itemSize: { textColor: Ink(0.45) },
    badge: { color: Ink(0.08), textColor: Ink(0.6) },
    removeButton: { textColor: Ink(0.45), hoverColor: T.danger },
};

// params: { primary: 1, width }
MediaPage.createButton = function(text, iconFile, onClick, params = {}) {
    const S = MediaPage.STYLE;
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

MediaPage.createTinySelect = function(list, onSelect) {
    const S = MediaPage.STYLE;
    return TinySelect({
        list: list,
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
        onSelect: onSelect,
    });
};

MediaPage.createHoldToDelete = function(onConfirm) {
    const S = MediaPage.STYLE;
    const btn = HoldToConfirmButton({
        height: 40,
        labelText: "Hold to Delete",
        completedText: "DELETED",
        iconFile: "../../comp-m3/hold-to-confirm-button/trash.png",
        holdingIconFile: "../../comp-m3/hold-to-confirm-button/trash-red.png",
        holdDuration: 1200,
        resetDelay: 800,
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
        onConfirm: onConfirm,
    });
    btn.icon.elem.style.filter = T.iconFilter; // WHY: Only the normal icon is on a dark background.
    return btn;
};

MediaPage.getSmartTableStyle = function(libPath, placeholderText) {
    const S = MediaPage.STYLE;
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
            placeholderText: placeholderText,
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

// *** STATIC: HELPERS

MediaPage.formatSize = function(bytes) {
    if (bytes < 1024) return bytes + " B";
    const units = ["KB", "MB", "GB", "TB"];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    return ((value < 10) ? value.toFixed(1) : Math.round(value)) + " " + units[unit];
};

// Local time: "2026-09-16 14:05"
MediaPage.formatSortableDate = function(time) {
    const d = new Date(time);
    const pad = function(n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
};

MediaPage.getExtension = function(name) {
    const index = name.lastIndexOf(".");
    return (index > 0) ? name.slice(index + 1).toLowerCase() : "";
};

MediaPage.getTypeByExtension = function(extension) {
    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(extension)) return "image";
    if (["mp4", "mov", "webm", "avi"].includes(extension)) return "video";
    if (["mp3", "wav", "ogg", "m4a"].includes(extension)) return "audio";
    if (["zip", "rar", "7z", "gz"].includes(extension)) return "archive";
    return "document";
};

MediaPage.getPublicUrl = function(item) {
    return "https://cdn.mypanel.com/media/" + item.folder.toLowerCase() + "/" + encodeURIComponent(item.name);
};

// T.accent, 0.2 -> "rgba(101, 162, 147, 0.2)"
MediaPage.alpha = function(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + alpha + ")";
};

// T.accent -> "#9A5D6C"
MediaPage.invertColor = function(hex) {
    return "#" + (0xFFFFFF ^ parseInt(hex.slice(1), 16)).toString(16).padStart(6, "0");
};

// *** STATIC: TEST DATA

MediaPage.FOLDERS = ["Products", "Blog", "Banners", "Documents"];

MediaPage._nextId = 1;
MediaPage._items = null;

// { name, folder, size, uploadedAt, uploadedBy, alt, width, height }
MediaPage.createItem = function(data) {
    const extension = MediaPage.getExtension(data.name);
    const item = {
        id: MediaPage._nextId++,
        name: data.name,
        extension: extension,
        type: MediaPage.getTypeByExtension(extension),
        folder: data.folder,
        size: data.size,
        width: data.width || 0,
        height: data.height || 0,
        alt: data.alt || "",
        uploadedAt: data.uploadedAt,
        uploadedBy: data.uploadedBy || "Bugra Ozden",
        url: data.url || "", // Thumbnail and download address. "" for files without a preview.
        isObjectUrl: 0,
        isNew: data.isNew || 0,
    };
    item.publicUrl = MediaPage.getPublicUrl(item);
    return item;
};

// Placeholder photo: gradient sky, sun and mountains (SVG data URL)
MediaPage.createPlaceholderImage = function(hue) {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 240'>" +
        "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
        "<stop offset='0' stop-color='hsl(" + hue + ",55%,64%)'/><stop offset='1' stop-color='hsl(" + (hue + 40) + ",45%,30%)'/>" +
        "</linearGradient></defs>" +
        "<rect width='320' height='240' fill='url(#g)'/>" +
        "<circle cx='" + (180 + hue % 80) + "' cy='72' r='26' fill='rgba(255,255,255,0.7)'/>" +
        "<path d='M0 240 L80 140 L140 196 L214 112 L320 240 Z' fill='rgba(0,0,0,0.28)'/>" +
        "</svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
};

// Files of the library. Created one time and kept while the panel is open.
MediaPage.getItems = function() {

    if (MediaPage._items) return MediaPage._items;

    const HOUR = 60 * 60 * 1000;
    const now = Date.now();

    // [name, folder, size (KB), hours ago, alt]
    const DATA = [
        ["headphones-black.jpg", "Products", 842, 3, "Black wireless headphones"],
        ["headphones-white.jpg", "Products", 815, 3, "White wireless headphones"],
        ["smart-watch.jpg", "Products", 1240, 20, "Smart watch on a wooden table"],
        ["running-shoes.jpg", "Products", 968, 26, "Blue running shoes"],
        ["coffee-mug.png", "Products", 412, 50, "Ceramic coffee mug"],
        ["backpack-grey.jpg", "Products", 1105, 73, ""],
        ["desk-lamp.jpg", "Products", 734, 98, "Desk lamp with warm light"],
        ["product-demo.mp4", "Products", 48200, 120, ""],
        ["summer-sale-hero.jpg", "Banners", 2480, 6, "Summer sale banner"],
        ["summer-sale-mobile.jpg", "Banners", 1320, 6, "Summer sale banner (mobile)"],
        ["free-shipping.png", "Banners", 540, 60, "Free shipping banner"],
        ["black-friday-2025.jpg", "Banners", 2210, 7000, ""],
        ["newsletter-header.png", "Banners", 690, 300, "Newsletter header"],
        ["promo-video.mp4", "Banners", 96400, 150, ""],
        ["how-to-choose-headphones.jpg", "Blog", 1560, 30, "Person listening to music"],
        ["morning-routine.jpg", "Blog", 1870, 140, "Coffee and notebook on a desk"],
        ["team-photo-2026.jpg", "Blog", 3240, 200, "Our team in the office"],
        ["office-tour.jpg", "Blog", 2950, 210, "Office meeting room"],
        ["podcast-episode-12.mp3", "Blog", 38400, 170, ""],
        ["interview-cover.png", "Blog", 880, 400, "Interview cover"],
        ["price-list-2026.pdf", "Documents", 1320, 12, ""],
        ["terms-of-service.pdf", "Documents", 284, 900, ""],
        ["privacy-policy.pdf", "Documents", 196, 900, ""],
        ["product-catalog.pdf", "Documents", 18400, 48, ""],
        ["q3-sales.xlsx", "Documents", 96, 80, ""],
        ["brand-guidelines.pdf", "Documents", 9850, 1500, ""],
        ["press-kit.zip", "Documents", 64200, 700, ""],
        ["supplier-contract.docx", "Documents", 142, 260, ""],
        ["investor-deck.pptx", "Documents", 12600, 330, ""],
    ];

    MediaPage._items = DATA.map(function(row, index) {
        const item = MediaPage.createItem({
            name: row[0],
            folder: row[1],
            size: row[2] * 1024,
            uploadedAt: now - row[3] * HOUR,
            alt: row[4],
            uploadedBy: (index % 3 == 0) ? "Deniz Arslan" : "Bugra Ozden",
        });
        if (item.type == "image") {
            item.url = MediaPage.createPlaceholderImage((index * 37) % 360);
            item.width = (item.name.includes("mobile")) ? 1080 : 1920;
            item.height = (item.name.includes("mobile")) ? 1350 : 1080;
        }
        return item;
    });

    return MediaPage._items;

};
