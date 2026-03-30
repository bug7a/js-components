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
    height: "100%", // "100%", "calc(100% - 20px)", "auto" or number.
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

// The code "window.myTable = UITable.create(tableOptions);" is used to create the JavaScript JSON Data Table component. The "tableOptions" parameter is an object used to define the appearance and properties of the component.

// - Mouse ile üzerine gelme ve tıklama effectleri css ile düzenleniyor.
// - ScrollBar özelleştirme css ile düzenleniyor.

window.titleDataList = [
    { id:"id", name: "ID", itemDataIndex: 0, itemDataType: "integer", width: 60, itemTextAlign: "left", enableSorting: 1, sortBy: "desc" },
    { id:"name", name: "Name", itemDataIndex: 1, itemDataType: "string", width: "auto", itemTextAlign: "left", enableSorting: 1 },
    { id:"age", name: "Age", itemDataIndex: 3, itemDataType: "integer", width: 100, itemTextAlign: "center", enableSorting: 1 },
    { id:"city", name: "City", itemDataIndex: 2, itemDataType: "string", width: "auto", itemTextAlign: "left" }
];
// NOTE: For multi line title, use <br> tag.

myTable.createTitles(titleDataList);
// - Title id olmak zorunda. itemDataIndex, o title altına eklenecek itemDataList in index i.

// Tablonun başlangıç posisyonu:
tableObject.position = "absolute";
tableObject.left = 0;
tableObject.top = 0;

// myTable.sort("title-id", "asc"); // "asc" or "desc"
// myTable.filterByText("searchText", "title-id") // title-id boş bırakılır ise, hepsinde arama yapılır.

// Customize title and item style:
myTable.setTitleRowStyle(titleRowStyle);
myTable.setTitleCellStyle(titleCellStyle);
myTable.setItemRowStyle(itemRowStyle);
myTable.setItemCellStyle(itemCellStyle);
// - Tablonun her bir alanı özelleştirilebilir.


myTable.selectItemById("item-id");
myTable.getSelectedItemId();
const itemRow = myTable.getSelectedItemRow();