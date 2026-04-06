UsersPageDefaults = {
    color: "black",
};

const UsersPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, UsersPageDefaults, mainView);

    mainView.setKey(UsersPage.KEY);

    let newId = null;
    let selectedId = null;

    let titleDataList = [
        { name: "ID", dataTitle: "id", dataType: "integer", width: 100, shortable: 1 },
        { name: "NAME", dataTitle: "name", dataType: "string", width: 180, shortable: 1 },
        { name: "EMAIL", dataTitle: "email", dataType: "string", width: 290, shortable: 0 },
        { name: "", dataTitle: "active", dataType: "boolean", width: 80, shortable: 0 },
    ];

    let itemDataList = [
        { id: 1, name: "Bugra Ozden", desc: "Developer", email: "bugra.ozden@gmail.com", active: 1 },
        { id: 2, name: "Alper Kaya", desc: "Product Manager", email: "a.kaya@company.net", active: 1 },
        { id: 3, name: "Murat Demir", desc: "Backend Engineer", email: "mdemir@work.io", active: 0 },
        { id: 4, name: "Deniz Arslan", desc: "UI/UX Designer", email: "deniz_arslan@studio.com", active: 1 },
        { id: 5, name: "Nilüfer Çelik", desc: "Data Analyst", email: "n.celik@datahouse.org", active: 1 },
        { id: 6, name: "Frank Weber", desc: "DevOps Engineer", email: "frank.weber@infrateam.de", active: 0 },
        { id: 7, name: "Dany Moreau", desc: "Mobile Developer", email: "dmoreau@appworks.fr", active: 0 },
        { id: 8, name: "Duygu Şahin", desc: "QA Engineer", email: "duygu.sahin@testlab.com", active: 0 },
        { id: 9, name: "Filiz Yıldız", desc: "Scrum Master", email: "f.yildiz@agile.io", active: 1 },
        { id: 10, name: "Anka Polat", desc: "System Architect", email: "anka_polat@systems.net", active: 1 },
        { id: 11, name: "Ceren Aktaş", desc: "Frontend Developer", email: "ceren.aktas@webco.com", active: 1 },
        { id: 12, name: "Emre Güneş", desc: "Database Administrator", email: "e.gunes@dbworks.org", active: 0 },
        { id: 13, name: "Selin Koç", desc: "Business Analyst", email: "selin.koc@analytics.io", active: 1 },
        { id: 14, name: "Tarık Yılmaz", desc: "Cloud Engineer", email: "tarik.yilmaz@cloudbase.co", active: 1 },
        { id: 15, name: "Yasemin Doğan", desc: "Technical Writer", email: "y.dogan@docshub.net", active: 0 },
        { id: 16, name: "Kemal Aydın", desc: "Security Specialist", email: "kemal_aydin@securelab.com", active: 1 },
        { id: 17, name: "Pınar Erdoğan", desc: "HR Manager", email: "p.erdogan@people.io", active: 0 },
        { id: 18, name: "Baran Çetin", desc: "Full Stack Developer", email: "baran.cetin@devstack.net", active: 1 },
        { id: 19, name: "Zeynep Karaca", desc: "Marketing Specialist", email: "zkaraca@brandworks.com", active: 1 },
        { id: 20, name: "Hakan Bulut", desc: "Network Engineer", email: "h.bulut@netcore.org", active: 0 },
    ];

    box.destroy = function() {
        box.remove();
        box = null;
    };

    const findNextAvailableID = function () {

        if (itemDataList.length === 0) return 1;

        let maxId = 0;
        for (let i = 0; i < itemDataList.length; i++) {
            if (itemDataList[i].id > maxId) maxId = itemDataList[i].id;
        }

        return maxId + 1;

    };

    const updateCustomItemCell = function (itemCell, titleDataIndex, data) {

        // dataTitle: active
        if (titleDataIndex == 3) {

            if (data == 1) {
                itemCell.boxCheck.color = "#3D7A6B"; //"#E7BB67";

            } else {
                itemCell.boxCheck.color = "white";
            }

            const _size = itemCell.height - 12;

            itemCell.boxCheck.width = _size;
            itemCell.boxCheck.height = _size;

        };

    };

    const createCustomItemCell = function (itemCell, titleDataIndex) {

        // CALL ONE TIME

        // dataTitle: active
        if (titleDataIndex == 3) {

            itemCell.label.visible = 0;

            itemCell.boxCustom = HGroup();
            itemCell.add(itemCell.boxCustom);

            const _size = itemCell.height - 12;

            itemCell.boxCheck = Box({
                width: _size,
                height: _size,
                border: 1,
                color: "white",
                round: 100,
            });
            that.elem.style.minHeight = "10px";
            that.elem.style.minWidth = "10px";

            endGroup();

        };

        return itemCell;

    };

    box.editUser = function(itemData) {

        EditUser({
            itemData: itemData,
            onSave: function(itemData) {
                box.saveItem(itemData);
                rightView.hide();
                rightView.clean();

            },
            onDelete: function(itemData) {
                box.deleteItem(itemData);
                rightView.hide();
                rightView.clean();

            },
        });

    };

    box.saveItem = function(itemData) {

        selectedId = itemData.id;

        const index = itemDataList.findIndex(function (item) {
            return item.id === selectedId;
        });

        if (index !== -1) {
            itemDataList[index].name = itemData.name;
            itemDataList[index].email = itemData.email;
            itemDataList[index].active = itemData.active || 0;
            smartTable1.setItemDataList(itemDataList);
        }

    };

    box.deleteItem = function(itemData) {

        selectedId = itemData.id;

        const index = itemDataList.findIndex(function (item) {
            return item.id === selectedId;
        });

        if (index !== -1) {
            itemDataList.splice(index, 1);
            smartTable1.setItemDataList(itemDataList);
            //lblStatus.text = "Deleted ID: " + selectedId;
            //clearForm();
        }

    };

    HGroup({
        align: "left center",
        height: 60,
        padding: [20, 0],
    });

        Label({
            text: "USERS TABLE",
            textColor: White(0.85),
        });

    endGroup();

    HGroup({
        align: "right center",
        height: 60,
        padding: [42, 0],
    });

        box.btnAddNew = Button({
            text: "ADD NEW",
            fontSize: 16,
            width: "auto",
            padding: [20, 0],
            color: "#3D7A6B", // "#2C5A38", // "#344f6c", "#583432", "#2C5A38"
            minimal: 1,
            round: 100,
            height: 40,
            textColor: White(0.95),
            border: 1,
            borderColor: White(0.3),
        });
        UI.effectButton(that);
        that.on("click", function(self, event) {

            let itemData = { id: newId, name: "User " + newId, desc: "desc", email: "user" + newId + "a@test.com", active: 0 };
            itemDataList.push(itemData);
            newId++;
            smartTable1.setItemDataList(itemDataList);
            box.editUser(itemData);

        });

    endGroup();

    HGroup({
        align: "top left",
        padding: [20, 0, 20, 20],
        top: 60,
        height: "calc(100% - 60px)",
    });

        window.smartTable1 = SmartTable({
            fillTestData: 0,
            titleDataList: titleDataList,
            itemDataList: itemDataList,
            createCustomItemCell: createCustomItemCell,
            updateCustomItemCell: updateCustomItemCell,
            sortByTitleIndex: 0,
            sortDirection: "Z-A", // "A-Z" or "Z-A"
            invertColor: 0,
            scrollBarParams: {
                bar_border: 0,
                bar_round: 3,
                bar_borderColor: "rgba(255, 255, 255, 0.15)",
                bar_width: 4,
                bar_mouseOverWidth: 4,
                bar_mouseOverColor: "#A0A0A0",
                bar_opacity: 0.4,
                bar_mouseOverOpacity: 0.9,
                bar_padding: 2,
                bar_color: "#A0A0A0",
                neverHide: 0,
                showDots: 0,
            },
            searchInputParams: {
                width: "50%",
                height: 36,
                border: 0,
                round: 8,
                color: "#141414DD", // rgba(255,255,255,0.8), rgba(0,0,0,0.1)
                textColor: "#EBEBEB",
                searchIconSize: 16,
                placeholderText: "Filter",
                fontSize: 16,
                invertIconColor: 1,
                //borderColor: "rgba(255, 255, 255, 0.15)",
                //borderBottomStyle: "1px solid rgba(255, 255, 255, 0.15)",
                searchIconFile: "../../comp-m2/search-input-v2/filter.png",
                clearIconFile: "../../comp-m2/search-input-v2/clear.svg",

            },
            style: {
                width: "100%",
                height: "100%",
                round: 6,
                line1Color: "#1E1E1E",
                line2Color: "#2A2A2A",
                highlightItemCellColor: "#583432", // "#3A3010",
                highlightTitleCellColor: White(0.08),
                verticalScrollWidth: 20,
                verticalScrollMargin: 2,
                btnScrollDownIconFile: "../../comp-m3/smart-table/down.png",
                btnScrollUpIconFile: "../../comp-m3/smart-table/up.png",
                btnScrollCenterIconFile: "../../comp-m3/smart-table/scroll.png",
                sortIconFile: "../../comp-m3/smart-table/sort.png",
                invertIconColor: 1,

                box: { color: "#1E1E1E" },
                boxBorder: { border: 2, borderColor: "rgba(255, 255, 255, 0.15)" },
                boxTitleLine: { color: "#3D7A6B" },
                boxTitleCell: { padding: [8, 0], borderRight: "1px solid rgba(255, 255, 255, 0.08)", borderBottom: "2px solid #FFFFFF44" },
                lblTitleCell: { fontSize: 20, fontFamily: "opensans", textColor: White(0.95), },
                boxItemCell: { borderBottom: "1px solid rgba(255, 255, 255, 0.08)", borderRight: "1px solid rgba(255, 255, 255, 0.04)", padding: [8, 0] },
                lblItemCell: { fontSize: 20, textColor: "rgba(255, 255, 255, 0.75)", fontFamily: "opensans" },
                boxInfoLine: { color: "#252525", borderTop: "1px solid rgba(255, 255, 255, 0)" },
                lblBoxInfoLine: { fontSize: 16, textColor: White(0.85), },
                lblNoDataFound: { color: "#707070", padding: [8, 2], fontSize: 14, round: 8, border: 1, borderColor: "rgba(255, 255, 255, 0.2)" },
                btnScrollCenter: { color: "#2C2C2C", round: 100, borderColor: "rgba(255,255,255,0.2)", border: 1 },
                btnScrollUp: { color: "#3A3A3A", round: 100, border: 1, borderColor: White(0.3), },
                btnScrollDown: { color: "#3A3A3A", round: 100, border: 1, borderColor: White(0.3), },
                boxSort: { color: "#3D7A6B" },

            },
        });
        smartTable1.onSelect = function (itemData) {
            box.editUser(itemData);
        };

    endGroup();

    newId = findNextAvailableID();
    
    return box.endPage();

};

UsersPage.KEY = "Users";