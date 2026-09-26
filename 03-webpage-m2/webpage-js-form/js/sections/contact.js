/* Bismillah */

/*

Contact Section - v26.09

- Teklif formu. Gönderim adresi: CONFIG.formEndpoint
- CONFIG.formEndpoint boş ise; form, ziyaretçinin e-posta programını açar (mailto).

*/

"use strict";

const ContactSection = function () {

    const L = SITE.L;
    const T = SITE.T.contact;

    // *** PRIVATE VARIABLES:
    let nameInput = null;
    let companyInput = null;
    let emailInput = null;
    let messageInput = null;
    let formGroup = null;
    let resultGroup = null;
    let sendButton = null;
    let warningLabel = null;
    let packageChipList = [];
    let selectedPackageIndex = 0;
    let isSending = 0;

    // *** PRIVATE FUNCTIONS:

    // Seçili paket kutucuğunu boyar.
    const refreshPackageChips = function () {

        packageChipList.forEach(function (chip, index) {
            const selected = (index == selectedPackageIndex);
            chip.color = selected ? SITE.PRIMARY : SITE.BG;
            chip.textColor = selected ? SITE.WHITE : SITE.TEXT_SOFT;
            chip.borderColor = selected ? SITE.PRIMARY : SITE.LINE;
        });

    };

    // Zorunlu alanlar dolu mu?
    const isFormValid = function () {

        if (nameInput.getInputValue().length === 0) return 0;
        if (emailInput.getInputValue().length === 0) return 0;
        if (!emailInput.isValid()) return 0;
        if (messageInput.getInputValue().length === 0) return 0;

        return 1;

    };

    // Gönderilecek veri.
    const createFormData = function () {

        return {
            name: nameInput.getInputValue(),
            company: companyInput.getInputValue(),
            email: emailInput.getInputValue(),
            package: T.packageList[selectedPackageIndex],
            message: messageInput.getInputValue(),
            language: SITE.lang,
            page: window.location.href,
            date: new Date().toISOString(),
        };

    };

    // Servis ayarlı değil ise; e-posta programını aç.
    const sendWithMailto = function (data) {

        const subject = CONFIG.brandName + " - " + data.package + " - " + data.name;

        const body = ""
            + data.name + (data.company ? " / " + data.company : "") + "\n"
            + data.email + "\n"
            + data.package + "\n\n"
            + data.message + "\n";

        go("mailto:" + CONFIG.email
            + "?subject=" + encodeURIComponent(subject)
            + "&body=" + encodeURIComponent(body));

        showResult(1, T.mailtoText);

    };

    // Formu servise gönder.
    const sendToService = function (data) {

        const headers = { "Content-Type": "application/json" };
        if (CONFIG.formSendAcceptJSON) headers["Accept"] = "application/json";

        let body = JSON.stringify(data);

        if (CONFIG.formEndpointType == "form") {
            headers["Content-Type"] = "application/x-www-form-urlencoded";
            const parts = [];
            for (let key in data) {
                parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
            }
            body = parts.join("&");
        }

        fetch(CONFIG.formEndpoint, {
            method: "POST",
            headers: headers,
            body: body,
        })
        .then(function (response) {
            setSending(0);
            if (response.ok) {
                showResult(1);
            } else {
                showResult(0);
            }
        })
        .catch(function () {
            setSending(0);
            showResult(0);
        });

    };

    // Gönderim sırasında düğmeyi kilitle.
    const setSending = function (value) {

        isSending = value;
        sendButton.text = value ? T.sendingText : T.sendButton;
        sendButton.enabled = value ? 0 : 1;

    };

    // Gönder düğmesi:
    const onSendClick = function () {

        if (isSending) return;

        // Uyarıları göster
        nameInput.checkIfInputIsRequiredAndEmpty();
        emailInput.checkIfInputIsRequiredAndEmpty();
        emailInput.showWarningIfNotValid(emailInput.isValid());
        messageInput.checkIfInputIsRequiredAndEmpty();

        if (!isFormValid()) {
            warningLabel.text = T.missingText;
            warningLabel.opacity = 1;
            return;
        }

        warningLabel.opacity = 0;

        const data = createFormData();

        if (!CONFIG.formEndpoint) {
            sendWithMailto(data);
            return;
        }

        setSending(1);
        sendToService(data);

    };

    // Sonuç ekranını göster / gizle.
    const showResult = function (isSuccess, customText) {

        formGroup.visible = 0;

        resultGroup.icon.load(isSuccess ? "assets/icons/success.png" : "assets/icons/error.png");
        resultGroup.iconBox.color = isSuccess ? SITE.MINT : "rgba(229, 136, 94, 0.18)";
        resultGroup.titleLabel.text = isSuccess ? T.successTitle : T.errorTitle;
        resultGroup.messageLabel.text = customText || (isSuccess ? T.successText : (T.errorText + " " + CONFIG.email));
        resultGroup.visible = 1;

    };

    const hideResult = function () {

        resultGroup.visible = 0;
        formGroup.visible = 1;

    };

    // *** PUBLIC (SITE) FUNCTIONS:
    // Fiyat kartlarından çağrılır.
    SITE.selectPackage = function (index) {

        selectedPackageIndex = index;
        refreshPackageChips();

    };

    // *** SECTION VIEW:
    const strip = SITE.startSection({
        key: "contact",
        color: SITE.INK,
        align: "center top",
        gap: L.mobile ? 30 : 40,
    });

    strip.elem.style.background =
        "radial-gradient(800px 420px at 20% 0%, rgba(44, 90, 56, 0.55), rgba(0, 0, 0, 0) 60%), " + SITE.INK;

        const formW = L.mobile ? L.content : Math.round(L.content * 0.56);
        const textW = L.mobile ? L.content : (L.content - formW - 48);
        const padding = L.mobile ? 22 : 32;
        const innerW = formW - (padding * 2) - 2;

        // Ortak alan görünümü (04-template-m2/js-form/unfinished-basic-form.htm ile aynı).
        const inputStyle = {
            backgroundColor: "#F6F6F6",
            selectedBackgroundColor: "#F6F6F6",
            lineColor: Black(0),
            selectedLineColor: Black(0),
            backBorderColor: Black(0),
            selectedBackBorderColor: Black(0.4),
            backBorderTopRound: 8,
            backBorderBottomRound: 8,
        };

        // GROUP: Metin + form
        if (L.mobile) {
            VGroup({ width: "100%", height: "auto", align: "left top", gap: 30 });
        } else {
            HGroup({ width: "100%", height: "auto", align: "left top", gap: 48 });
        }

            // GROUP: Sol sütun
            VGroup({
                width: textW,
                height: "auto",
                align: "left top",
                gap: 14,
            });

                SITE.eyebrow(T.eyebrow, 1);

                SITE.h2(T.title, 1);

                SITE.lead(T.lead, textW, 1);

                SITE.space(6);

                SITE.divider(textW, 1);

                SITE.space(6);

                // LABEL: Doğrudan iletişim
                Label({
                    text: T.orText,
                    width: textW,
                    fontSize: L.small,
                    textColor: SITE.ON_DARK_FAINT,
                });

                SITE.link(CONFIG.email, function () {
                    go("mailto:" + CONFIG.email);
                }, 1, L.lead);
                that.elem.style.fontFamily = SITE.BOLD;
                that.textColor = SITE.PRIMARY_LIGHT;

                if (CONFIG.phone) {
                    SITE.link(CONFIG.phone, function () {
                        go("tel:" + CONFIG.phone.replace(/ /g, ""));
                    }, 1, L.body);
                }

            endGroup(); // Sol sütun

            // CARD: Form kutusu
            startBox(0, 0, formW, "auto", {
                color: SITE.WHITE,
                round: 16,
                border: 1,
                borderColor: "transparent",
            });
            that.elem.style.padding = padding + "px";
            that.elem.style.boxShadow = "0px 20px 50px rgba(0, 0, 0, 0.30)";
            if (!L.mobile) that.elem.style.flexShrink = "0";

                // GROUP: Form alanları
                formGroup = VGroup(0, 0, "100%", "auto", {
                    align: "left top",
                    gap: 22,
                });
                that.position = "relative";

                    // GROUP: Ad + Şirket
                    if (L.mobile) {
                        VGroup({ width: innerW, height: "auto", align: "left top", gap: 22 });
                    } else {
                        HGroup({ width: innerW, height: "auto", align: "left top", gap: 16 });
                    }

                        const halfW = L.mobile ? innerW : Math.floor((innerW - 16) / 2);

                        nameInput = InputB({
                            key: "name",
                            ...inputStyle,
                            width: halfW,
                            isRequired: 1,
                            titleText: T.nameTitle,
                            placeholder: T.namePlaceholder,
                            requiredText: T.requiredText,
                            maxChar: 60,
                        });

                        companyInput = InputB({
                            key: "company",
                            ...inputStyle,
                            width: halfW,
                            titleText: T.companyTitle,
                            placeholder: T.companyPlaceholder,
                            maxChar: 60,
                        });

                    endGroup();

                    emailInput = EmailInputB({
                        key: "email",
                        ...inputStyle,
                        width: innerW,
                        isRequired: 1,
                        titleText: T.emailTitle,
                        placeholder: T.emailPlaceholder,
                        requiredText: T.requiredText,
                        warningText: T.emailWarning,
                        maxChar: 60,
                    });

                    // GROUP: Paket seçimi
                    VGroup({
                        width: innerW,
                        height: "auto",
                        align: "left top",
                        gap: 10,
                    });

                        Label({
                            text: T.packageTitle,
                            width: innerW,
                            fontSize: 13,
                            textColor: "#373836",
                        });

                        // GROUP: Kutucuklar
                        HGroup({
                            width: innerW,
                            height: "auto",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                        });

                            packageChipList = [];

                            T.packageList.forEach(function (name, index) {

                                Label({
                                    text: name,
                                    width: "auto",
                                    height: "auto",
                                    fontSize: 13,
                                    textColor: SITE.TEXT_SOFT,
                                    color: SITE.BG,
                                    round: 100,
                                    border: 1,
                                    borderColor: SITE.LINE,
                                });
                                that.elem.style.padding = "9px 14px";
                                that.elem.style.whiteSpace = "nowrap";
                                that.elem.style.cursor = "pointer";
                                that.setMotion("background-color 0.15s, color 0.15s, border-color 0.15s");

                                const chip = that;
                                chip.on("click", function () {
                                    selectedPackageIndex = index;
                                    refreshPackageChips();
                                });

                                packageChipList.push(chip);

                            });

                        endGroup();

                    endGroup(); // Paket seçimi

                    messageInput = TextareaB({
                        key: "message",
                        ...inputStyle,
                        width: innerW,
                        isRequired: 1,
                        titleText: T.messageTitle,
                        placeholder: T.messagePlaceholder,
                        requiredText: T.requiredText,
                        warningText: T.messageWarning,
                        minCharCount: 0,
                        showCount: 0,
                        maxChar: 1200,
                        height: 140,
                    });

                    SITE.space(2);

                    // GROUP: Gönder satırı
                    VGroup({
                        width: innerW,
                        height: "auto",
                        align: "left top",
                        gap: 10,
                    });

                        sendButton = SITE.button({
                            text: T.sendButton,
                            kind: "primary",
                            width: innerW,
                            height: 52,
                            onClick: onSendClick,
                        });

                        // LABEL: Eksik alan uyarısı
                        Label({
                            text: T.missingText,
                            width: innerW,
                            fontSize: 13,
                            textAlign: "center",
                            textColor: SITE.ACCENT,
                            opacity: 0,
                        });
                        warningLabel = that;

                    endGroup();

                endGroup(); // Form alanları

                // GROUP: Sonuç ekranı
                resultGroup = VGroup(0, 0, "100%", "auto", {
                    align: "center top",
                    gap: 14,
                    visible: 0,
                });
                that.position = "relative";
                that.elem.style.padding = "30px 0px";

                    resultGroup.iconBox = VGroup({
                        width: 64,
                        height: 64,
                        align: "center",
                        color: SITE.MINT,
                        round: 100,
                    });

                        resultGroup.icon = Icon({ width: 30, height: 30, opacity: 0.85 });
                        that.load("assets/icons/success.png");

                    endGroup();

                    resultGroup.titleLabel = SITE.h3(T.successTitle);
                    that.textAlign = "center";

                    resultGroup.messageLabel = SITE.text(T.successText, innerW);
                    that.textAlign = "center";

                    SITE.space(4);

                    SITE.button({
                        text: T.closeButton,
                        kind: "ghost",
                        height: 44,
                        fontSize: 14,
                        onClick: hideResult,
                    });

                endGroup(); // Sonuç ekranı

            endBox(); // Form kutusu

        endGroup(); // Metin + form

    SITE.endSection();

    refreshPackageChips();

};
