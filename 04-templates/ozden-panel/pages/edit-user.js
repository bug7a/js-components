EditUserDefaults = {
    color: "#DBDDDC",
    clickable: 1,
    itemData: [],
    onSave: function(itemData) {},
    onDelete: function(itemData) {},
};

const EditUser = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, EditUserDefaults);

    // Edit params, if needed:
    params.top = 0;
    params.left = 0;
    params.width = "100%";
    params.height = "100%";

    // BOX: Component container
    let box = startObject(params);

    let inputId, inputName, inputEmail, inputActive, toggleActive;
    let btnEdit, btnDelete;
    let selectedId = null; // (it was not declared: it became window.selectedId)

    // Fill input fields from selected data
    const fillForm = function (itemData) {

        selectedId = itemData.id;
        inputId.setValue(String(itemData.id));
        inputName.setValue(itemData.name);
        inputEmail.setValue(itemData.email);
        inputActive.setValue(String(itemData.active));
        toggleActive.setValue(itemData.active);
        //lblStatus.text = "Selected ID: " + itemData.id;
        btnEdit.enabled = 1;
        btnDelete.clickable = 1;
        btnDelete.opacity = 1;

    };

    // Clear input fields
    const clearForm = function () {

        selectedId = null;
        inputId.setValue("");
        inputName.setValue("");
        inputEmail.setValue("");
        inputActive.setValue("");
        toggleActive.setValue(0);
        //lblStatus.text = "No record selected";
        btnEdit.enabled = 0;
        btnDelete.clickable = 0;
        btnDelete.opacity = 0.6;

    };

    const initEditForm = function () {

        const inputStyle = {
            styleName: "modern", // the first look of TextField: the colors below are for it
            width: "100%",
            height: "auto",
            leftPadding: 20,
            rightPadding: 20,
            border: 1,
            borderColor: Black(0.05),
            round: 4,
            showDescription: 0,
            backgroundColor: "#F6F6F6",
            focusBackgroundColor: "#FFFFFF",
            lineColor: "transparent",
            focusLineColor: T.accent,
            //backgroundColor: "transparent",
            //focusBackgroundColor: "transparent", // "#F1E2C4", "#F4FAFF",
            //lineColor: "transparent",
            //focusLineColor: "transparent", // "#F1E2C4", "#588ABE",
            showLeftBox: 0,
            showRightBox: 0,
            showUnit: 0,
            value: "",
            maxLength: 100,
            position: "relative",
        };

        const styleInput = function(self) {

            //self.input.color = "whitesmoke";
            //self.input.border = 1;
            //self.input.borderColor = "lightgray";
            //self.input.inputElement.style.padding = "0px 12px";

        };

        // ID (read-only)
        inputId = TextField({
            key: "id",
            ...inputStyle,
            titleText: "ID",
            placeholder: "Auto",
        });
        box.grpContent.add(that);
        styleInput(that);
        // Read-only
        inputId.input.enabled = 0;

        // Name
        inputName = TextField({
            key: "name",
            ...inputStyle,
            titleText: "NAME",
            placeholder: "Enter name",
        });
        styleInput(that);
        box.grpContent.add(that);

        // Email
        inputEmail = EmailField({
            key: "email",
            ...inputStyle,
            required: 0,
            titleText: "EMAIL",
            placeholder: "Enter email",
            warningText: "Invalid email format",
            warningColor: Theme.readable("#E5885E"), // "#F1BF3C"
        });
        styleInput(that);
        box.grpContent.add(that);

        // Active
        inputActive = NumberField({
            key: "active",
            ...inputStyle,
            titleText: "ACTIVE",
            placeholder: "1 or 0",
            maxLength: 1,
            allowNegative: 0,
            allowDecimal: 0,
        });
        styleInput(that);
        box.grpContent.add(that);
        that.visible = 0;

        // 0 or whatever enter just write 1
        inputActive.onChange = function () {

            const value = inputActive.getValue();
            if (!(value == 1 || value == 0)) inputActive.setValue("1");
            
        }

        const grpToggle = initToggle({ title: "ACTIVE" });
        toggleActive = grpToggle.toggle;

        /*
        lblStatus = Label({
            position: "relative",
            textColor: Black(0.4),
            fontSize: 14,
        });
        box.grpContent.add(that);
        */

    };

    const initToggle = function(params = { title: "", }) {

        const grp = HGroup({
            align: "left center",
            position: "relative",
            height: 100,
            color: "white",
            padding: [20, 0],
        });
        box.grpContent.add(that);

            grp.label = Label({
                text: params.title,
                position: "relative",
                textColor: Black(0.75),
                fontSize: 18,
            });

            HGroup({
                position: "absolute",
                align: "center right",
                padding: [20, 0],
            });

                grp.toggle = Toggle({
                    key: "0",
                    width: 70, // Standard box features are added automatically.
                    height: 40,
                    spacing: 3,
                    value: 1,
                    invertColor: 0,
                    backgroundStyle: {
                        color: "black",
                        selectedColor: T.primaryActive,
                        border: 1,
                        borderColor: Black(0.25),
                        round: 100,
                    },
                    buttonStyle: {
                        color: Ink(0.25),
                        selectedColor: Ink(0.75),
                        border: 0,
                        round: 100,
                    }
                });
                UI.effectButton(that);
                that.onChange = function(self) {
                    //println(`Changed: ${self.value}`);
                };

            endGroup(); // Toggle group

        endGroup(); // Label group

        return grp;

    };

    const initFormButtons = function () {

        const buttonStyle = {
            width: "auto",
            padding: [20, 0],
            //color: "#A8CFB1",
            fontSize: 16,
            minimal: 1,
            border: 1,
            round: 4,
            position: "relative",
        };

        // Edit Button
        btnEdit = Button({
            text: "Save",
            enabled: 0,
            color: Theme.readable("#86BA84"),
            ...buttonStyle,
        });
        box.grpButtons.add(that);
        that.elem.style.whiteSpace = "nowrap";
        UI.effectButton(that);
        that.on("click", function () {

            // WHY: an empty name or a wrong e-mail was saved
            const name = String(inputName.getValue() || "").trim();
            const email = String(inputEmail.getValue() || "").trim();
            const isEmailValid = UserListPage.isEmail(email);
            inputEmail.showWarningIfNotValid(isEmailValid);
            if (!name || !isEmailValid) return;

            box.itemData.name = name;
            box.itemData.email = email;
            //box.itemData.active = parseInt(inputActive.getValue()) || 0;
            box.itemData.active = toggleActive.value || 0;
            box.onSave(box.itemData);

        });

        // Delete Button (Hold to Confirm)
        const _assetsPath = "../../comp/hold-to-confirm-button/";
        btnDelete = HoldToConfirmButton({
            width: "auto",
            labelText: "Hold to Delete",
            completedText: "DELETED",
            iconFile: _assetsPath + "trash.png",
            holdingIconFile: _assetsPath + "trash-red.png",
            position: "relative",
            style: {
                layout: { gap: 4, padding: buttonStyle.padding, },
                icon: { width: 24, height: 24, },
                label: { fontSize: buttonStyle.fontSize, textColor: Black(0.65), },
                box: { color: buttonStyle.color, border: buttonStyle.border, borderColor: Black(0.3), round: buttonStyle.round, },
                holdingBox: { color: "#FFD1CB", },
                holdingLabel: { fontSize: buttonStyle.fontSize, },
            }
        });
        box.grpButtons.add(that);
        //UI.effectButton(that);
        btnDelete.clickable = 0;
        btnDelete.opacity = 0.6;

        btnDelete.onConfirm = function (self) {
            box.onDelete(box.itemData);
        };

    };

    const initTitle = function() {

        Label({
            text: "Edit User",
            padding: [0, 0],
            textColor: Black(0.85),
            position: "relative",
        });
        box.grpTitle.add(that);

    };

    const initView = function() {

        const GRP_TITLE_HEIGHT = 80;
        const GRP_BUTTONS_HEIGHT = 80;
        const PADDING_LEFT_RIGHT = 20;

        box.grpTitle = VGroup({
            padding: [PADDING_LEFT_RIGHT, 0],
            align: "center left",
            gap: 6,
            height: GRP_TITLE_HEIGHT,
        });

            // TITLE AT TOP

        endGroup();

        box.grpContent = VGroup({
            top: GRP_TITLE_HEIGHT,
            align: "top left",
            width: "100%",
            height: "calc(100% - " + (GRP_TITLE_HEIGHT + GRP_BUTTONS_HEIGHT) + "px)",
            padding: [PADDING_LEFT_RIGHT, 0],
            gap: 8,
        });

            // CONTENT

        endGroup();

        box.grpButtons = HGroup({
            gap: 8,
            padding: [PADDING_LEFT_RIGHT, 0],
            align: "right center",
            bottom: 0,
            height: GRP_BUTTONS_HEIGHT,
        });

            // BUTTONS AT BOTTOM

        endGroup();

        // Left line for View
        Box(0, 0, 1, "100%", { color: "white", });

    };

    box.destroy = function() {
        box.remove();
        box = null;
    };

    // *** PAGE INIT CODE:

    rightView.clean();
    rightView.setKey(EditUser.KEY);
    rightView.setWidth(550);
    rightView.add(box);
    
    box.elem.style.filter = T.iconFilter;

    initView();

    initTitle();
    initEditForm();
    initFormButtons();
    
    fillForm(box.itemData);

    rightView.show();
    rightView.destroyPage = box.destroy;

    return endObject(box);

};

EditUser.KEY = "EditUser";