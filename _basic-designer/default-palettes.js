/* Bismillah */

// DEFAULT PALETTES: the color groups that are always in the color picker of basic-designer (after "Used on this
// page", the UI tokens and your own color groups). Made from the palettes of Bugra (the user, 2026-10-27).
// A color: [value, name]. The name is the hint of the swatch ("" -> only the value).
// The order of a group is light to dark or by hue, so a color is found by its place.

BasicDesigner.DEFAULT_PALETTES = [

    // The colors used the most in the projects: the first place to look (the user, 2026-11-05: the tones of
    // SmartButton, its dark tones, whitesmoke, the checked color of CheckBox and the other colors of the kit; the
    // favorites before that went to the groups below).
    { key: "favorites", name: "★ Favorites", colors: [
        ["#FFFFFF", "white (SmartButton white)"],
        ["whitesmoke", "whitesmoke (fields, soft backgrounds)"],
        ["#F4F5F2", "soft box (InputB ozden, ItemList)"],
        ["lightgray", "lightgray (Toggle, ActionButton, LineProgressBar)"],
        ["#A0A0A0", "middle gray (ItemList, DataTable, SmartTable)"],
        ["#373836", "dark gray (InputB, ItemList, Form)"],
        ["#5BBAC1", "SmartButton cyan (the main action)"],
        ["#DE815B", "SmartButton orange (a delete)"],
        ["#F1C74A", "SmartButton yellow (look first)"],
        ["#7BC362", "SmartButton green (done)"],
        ["#52A8D0", "SmartButton blue (details, help)"],
        ["#376265", "SmartButton cyanDark"],
        ["#724837", "SmartButton orangeDark"],
        ["#7B682F", "SmartButton yellowDark"],
        ["#46663A", "SmartButton greenDark"],
        ["#335A6B", "SmartButton blueDark"],
        ["#1A1A19", "dark card (the dark tones sit on it)"],
        ["#242424", "checked CheckBox / RadioButton"],
        ["#141414", "dark of the kit (BottomBar circle)"],
        ["indianred", "indianred (warnings, badges)"],
        ["cadetblue", "cadetblue (focus, modern CheckBox)"],
        ["#65A293", "field focus (InputB)"],
    ] },

    // The jobs of the colors of an app: the tones of SmartButton (comp/smart-button.js, SmartButton.tones), so a
    // color taken by its job is the color of its button (the user, 2026-11-05; the old roles went to the groups below).
    { key: "roles", name: "Roles (primary, warning...)", colors: [
        ["#5BBAC1", "primary: the main action (SmartButton cyan)"],
        ["#FFFFFF", "secondary (SmartButton white)"],
        ["#7BC362", "confirm: done (SmartButton green)"],
        ["#F1C74A", "warning: look first (SmartButton yellow)"],
        ["#DE815B", "remove: a delete (SmartButton orange)"],
        ["#52A8D0", "help: details (SmartButton blue)"],
        ["indianred", "error (indianred)"],
    ] },

    // Black to white.
    { key: "grays", name: "Grays (black → white)", colors: [
        ["#000000", "black"],
        ["#131109", "warm black"],
        ["#161616", ""],
        ["#232323", "ink"],
        ["#2A2D2D", ""],
        ["#333333", ""],
        ["#3C4043", "slate"],
        ["#4A4A4A", ""],
        ["#576360", "green gray"],
        ["#808080", "gray"],
        ["#9E9E9E", ""],
        ["#BDBDBD", ""],
        ["#D9D9D9", ""],
        ["#E3E3E3", ""],
        ["#E8EAEE", "cool gray"],
        ["#F2F2F2", ""],
        ["whitesmoke", "whitesmoke"],
        ["#FFFFFF", "white"],
    ] },

    // Warm grays, sand and stone: backgrounds, cards, soft text.
    { key: "neutrals", name: "Neutrals (sand, stone)", colors: [
        ["#FFFCEC", "ivory"],
        ["#FFFBDB", "cream"],
        ["#F9FBEF", "paper"],
        ["#F1EDE5", "linen"],
        ["#F0E6E6", "blush white"],
        ["#DFD8CE", "oat"],
        ["#D3D0C4", "stone"],
        ["#D2C3BB", "taupe light"],
        ["#DCB9B6", "dusty rose"],
        ["#C5B8A7", "sand"],
        ["#BAB8A6", "sage gray"],
        ["#A6A48E", "olive gray"],
        ["#8D847E", "taupe"],
        ["#5F5A4D", "bark"],
        ["#5D5753", "mocha"],
        ["#50545C", "graphite"],
        ["#393756", "midnight purple"],
    ] },

    // Five warm and fresh colors that go together (the summer palette).
    { key: "summer", name: "Summer (Fiesta → Aegean)", colors: [
        ["#EC6650", "Fiesta"],
        ["#EEA44C", "Turmeric"],
        ["#EAC157", "Mango"],
        ["#55B2A8", "Aruba"],
        ["#5A8696", "Aegean"],
    ] },

    // Strong, clean colors of an app (by hue).
    { key: "flat", name: "Bright (flat UI)", colors: [
        ["#DE635E", "red"],
        ["#EE6A52", "tomato"],
        ["#E06A49", "flame"],
        ["#E89E5A", "orange"],
        ["#EAB04E", "amber"],
        ["#ECCA62", "yellow"],
        ["#86CD9B", "mint"],
        ["#6BAF83", "fern"],
        ["#56AD6A", "green"],
        ["#48975D", "dark green"],
        ["#76C7EE", "light blue"],
        ["#519ED8", "blue"],
        ["#4A82E5", "royal blue"],
        ["#3F67EB", "ultramarine"],
        ["#AF73D6", "lilac"],
        ["#8E57DE", "purple"],
        ["#6253B5", "violet"],
    ] },

    // Warm sets: the warm reds, yellows, greens and blues, each from light to dark.
    { key: "best", name: "Warm sets", colors: [
        ["#E07B5F", "coral"],
        ["#DE7466", "salmon"],
        ["#DD6B5A", "coral red"],
        ["#C3594A", "brick"],
        ["#BF2A2A", "red"],
        ["#F8E57A", "lemon"],
        ["#EBBE60", "honey"],
        ["#EBB651", "gold"],
        ["#E8B455", "mustard"],
        ["#CDA24F", "old gold"],
        ["#7BC362", "leaf"],
        ["#7BB56D", "moss"],
        ["#66A549", "grass"],
        ["#719ACF", "cornflower"],
        ["#608DEC", "bright blue"],
        ["#5275C0", "blue"],
        ["#5A7BC3", "denim"],
        ["#0E1C5E", "navy"],
        ["#1B1D2E", "night"],
        ["#F2F6E2", "pale green"],
    ] },

    // Soft, calm colors (pastel to deep), by hue.
    { key: "soft", name: "Soft (pastel → deep)", colors: [
        ["#FBEAC4", "vanilla"],
        ["#EBB8B6", "rose"],
        ["#F0A3BC", "pink"],
        ["#D97F80", "old rose"],
        ["#CB3527", "red"],
        ["#A92A20", "dark red"],
        ["#AF4D63", "raspberry"],
        ["#C3DBCE", "mint mist"],
        ["#9DC7B5", "sage"],
        ["#68AF8E", "jade"],
        ["#6FC7BD", "aqua"],
        ["#5BBAC1", "teal"],
        ["#60AEAC", "teal"],
        ["#5CA3AE", "sea"],
        ["#CEDBE1", "ice"],
        ["#8FA6BE", "fog blue"],
        ["#5A6C8C", "dusk blue"],
        ["#8E8EB3", "periwinkle"],
        ["#444CA0", "indigo"],
        ["#4B4079", "deep violet"],
        ["#DAD7E6", "lavender mist"],
        ["#CFC3DD", "lavender"],
        ["#C08BBE", "orchid"],
        ["#C077A6", "orchid pink"],
        ["#B596A9", "mauve"],
        ["#7B436E", "plum"],
    ] },

    // Deep warm colors: spice, wood, gem.
    { key: "jewel", name: "Spice & jewel", colors: [
        ["#E07558", "terracotta"],
        ["#DE815B", "clay"],
        ["#BC6A47", "copper"],
        ["#BB5D33", "rust"],
        ["#873427", "brown red"],
        ["#BE8A7E", "rosewood"],
        ["#DEA95E", "caramel"],
        ["#DBA83C", "saffron"],
        ["#B37E39", "bronze"],
        ["#E9C962", "corn"],
        ["#67A882", "emerald"],
        ["#B998C8", "wisteria"],
        ["#9762BB", "amethyst"],
        ["#6D397E", "grape"],
        ["#4E51B6", "sapphire"],
        ["#3A3233", "espresso"],
    ] },

    // Greens and blues of the sea and the forest.
    { key: "nature", name: "Sea & forest", colors: [
        ["#B0D6C3", "seafoam"],
        ["#72B99E", "green tea"],
        ["#B7C6B4", "willow"],
        ["#A4AF87", "olive"],
        ["#3B412D", "forest"],
        ["#27413F", "deep sea"],
        ["#B8C6D0", "mist"],
        ["#85BFDB", "sky"],
        ["#75B8CF", "lagoon"],
        ["#6DB1C3", "ocean"],
        ["#52A8D0", "sky blue"],
        ["#5D99D0", "harbor"],
        ["#6488BE", "steel blue"],
        ["#5A8DCB", "blue"],
        ["#436EBD", "deep blue"],
        ["#1A2E7C", "navy"],
        ["#B98C47", "sand dune"],
    ] },

];
