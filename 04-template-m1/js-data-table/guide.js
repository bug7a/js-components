//UI Table Guide:

/*

The JavaScript JSON Data Table component dynamically creates or updates a 
table by taking data from a JSON object. 
Users can sort the data based on desired headers and perform searches within the data. 
The component can also be fully customized visually by using an object that carries properties, 
and can also have special structures added to its cells. This allows you to display your data 
in a more understandable and user-friendly way.

*/

// Table Options
// - Bu değerler tabloyu oluştururken verilir.

const tableOptions = {
    width: "100%", // "100%", "calc(100% - 20px)" or number.
    height: "100%", // "100%", "calc(100% - 20px)" or number.
    showWithMotion: 1, // 1 or 0
    borderString: "1px solid lightgray",
    borderRadius: "6px 6px 6px 6px",
    boxShadow: "0px 0px 6px 2px rgba(0, 0, 0, 0.1)", // or "none"
    backgroundColor: "white",

    titleHeight: 50, // only number
    titleTopInnerSpace: "auto", // "auto" or number
    titleRowBackgroundColor: "whitesmoke",
    titleRowBottomBorderString: "1px solid rgba(0, 0, 0, 0.2)", // or "none"
    titleCellBackgroundColor: "whitesmoke",
    titleCellRightBorderString: "1px solid rgba(0, 0, 0, 0.08)",
    titleCellBottomBorderString: "1px solid rgba(0, 0, 0, 0.2)",
    titleFontSize: 16,
    titleFontFamily: "opensans-bold",
    titleTextColor: "rgba(0, 0, 0, 0.8)",
    titleBoxShadow: "-2px 0px 8px 2px rgba(0, 0, 0, 0.15)",
    createTitleCellContentBox: 0, // for special cell content.
    createTitleCellBackground: 1, // for special cell background.

    itemsCanSelectable: 1, // 1 or 0
    noItemAddedAlert: "There are no records.",
    noItemFoundAlert: "No records found.",
    itemHeight: "auto", // "auto" or number like 80
    itemRowBottomBorderString: "1px solid rgba(0, 0, 0, 0.1)",
    itemCellRightBorderString: "1px solid rgba(0, 0, 0, 0.03)",
    itemOddBackgroundColor: "white",
    itemEvenBackgroundColor: "whitesmoke",
    itemSelectedBackgroundColor: "rgba(254, 193, 8, 0.1)",
    itemFontSize: 16,
    itemFontFamily: "opensans",
    itemTextColor: "rgba(0, 0, 0, 0.7)",
    leftRightInnerSpace: 10,
    topBottomInnerSpace: 12,
    createItemCellContentBox: 0, // for special cell content.
    createItemCellBackground: 0, // for special cell background.
    itemIdValueIndex: 0,

    sortingWidth: 14,
    sortingHeight: 20,
    sortingBackgroundColor: "transparent",
    sortingBorderRadius: "2px 2px 2px 2px",
    sortingOuterPosition: "left", // "left" or "right"
    sortingOuterSpace: 4,
    sortingIconSize: 18,
    sortingIconFile: "js/components/ui-table/arrow.svg",
    sortingIconOpacity: 0.2,
    sortingIconSelectedOpacity: 1,

    topBarHeight: 0,
    topBarBackgroundColor: "whitesmoke",
    topBarBottomBorderString: "0px solid rgba(0, 0, 0, 0.2)",

    bottomBarHeight: 0,
    bottomBarBackgroundColor: "whitesmoke",
    bottomBarTopBorderString: "1px solid rgba(0, 0, 0, 0.2)",
};

// Create the table: window.myTable = UITable.create(tableOptions);
// - The mouse over and click effects and the scroll bar are styled with CSS (the samples: example2.htm, example4.htm).
// - In a normal web page: myTable.moveIntoDiv("my-table-div"); (the table fills the div)

window.titleDataList = [
    { id: "id", name: "ID", itemDataIndex: 0, itemDataType: "integer", width: 60, itemTextAlign: "left", enableSorting: 1, sortBy: "desc" },
    { id: "name", name: "Name", itemDataIndex: 1, itemDataType: "string", width: "auto", itemTextAlign: "left", enableSorting: 1 },
    { id: "age", name: "Age", itemDataIndex: 3, itemDataType: "integer", width: 100, itemTextAlign: "center", enableSorting: 1 },
    { id: "city", name: "City", itemDataIndex: 2, itemDataType: "string", width: "auto", itemTextAlign: "left" }
];
// - id is needed. itemDataIndex: the index of the value in the array of an item (no value: the index of the title).
// - itemDataType: "string" (the default), "integer" or "float": how the column is sorted.
// - width: a number or "auto" (the default): the "auto" titles share the width that is left.
// - sortBy: "asc" or "desc": the table is sorted by this title when the items are created.
// - name is HTML: for a multi line title, use the <br> tag; an icon: tool.useImageAsText() (example3.htm).
// - The values of the items are shown as plain text.

myTable.createTitles(titleDataList);
myTable.createItems(itemDataList); // [[1, "John Smith", "New York", 30], ...]
myTable.updateItems(itemDataList); // adds, changes and removes rows by their id; the sorting, the search and the selection stay
myTable.clearItems();

myTable.sort("age", "desc"); // "asc" or "desc"
myTable.clearSorting(); // the order of the data
myTable.filterByText("searchText", "title-id"); // without title-id: in every title. "": every row.

// Customize title and item style (run for every title / row / cell when it is created, and for a cell again in updateItems()):
myTable.setTitleRowStyle(function (titleRow) {});
myTable.setTitleCellStyle(function (titleCell, titleCellData, titleCellIndex) {}); // titleCell.background, .label, .box
myTable.setItemRowStyle(function (itemRow, itemData, itemIndex) {}); // itemRow.background, .cellList
myTable.setItemCellStyle(function (itemCell, itemCellData, titleCellData, itemRow, itemCellIndex) {}); // itemCell.background, .label, .box

// Events:
myTable.on("click", function (itemRow) {}); // a click on a row (also when itemsCanSelectable is 0)

// Selection:
myTable.selectItemById(5);
myTable.clearSelection();
myTable.getSelectedItemId(); // null: nothing is selected
myTable.getSelectedItemData();
myTable.getSelectedItemRow(); // (the same as getSelectedItem())
myTable.getSelectedItemIndex();

// Titles:
myTable.getTitleCellById("name");
myTable.getTitleIndexById("name");
myTable.getTitleCellWidthById("name");
myTable.setTitleCellWidthById("name", 300); // a number or "auto"

// Others:
myTable.getBiggestId(); // the biggest id: for a new item
myTable.addScrollBarCssClass("table-scrollbar");
