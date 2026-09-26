/* Bismillah */

/*

JS Form Website - Site Texts (TR / EN) - v26.09

- Sitedeki bütün metinler burada. Sayfayı düzenlemek için buradan başlayın.
- All site copy lives here. Start here to edit the page.

NOTE: Fiyatlar (pricing) örnektir; kendi fiyatlarınızı yazın.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const TEXTS = {};

// *** TÜRKÇE:
TEXTS.tr = {

    langName: "TR",
    otherLangName: "EN",
    htmlLang: "tr",

    // SEO:
    pageTitle: "Web Sitenize Hazır Formlar: İletişim, Randevu, Sipariş | JS Form",
    pageDescription: "İletişim, randevu, sipariş, iş başvurusu ve destek formları. Sitenize tek satırla eklenir, cevaplar düzenli bir e-posta olarak size gelir. Aylık form servisi ücreti yok; açık kaynak.",
    pageKeywords: "web formu, iletişim formu, randevu formu, sipariş formu, iş başvuru formu, destek talebi formu, etkinlik kayıt formu, form e-posta gönderme, php mail formu, açık kaynak form, javascript form",

    // MENU:
    menu: {
        services: "Hizmetler",
        features: "Özellikler",
        demo: "Demo",
        pricing: "Fiyatlar",
        openSource: "Açık Kaynak",
        faq: "SSS",
        contact: "İletişim",
        cta: "Teklif Alın",
        open: "Menü",
        close: "Kapat",
    },

    // HERO:
    hero: {
        eyebrow: "WEB FORMLARI · AÇIK KAYNAK",
        title: "Sitenize eklenen, cevapları doğrudan e‑postanıza gelen formlar.", // NOTE: "e‑posta" bölünmeyen tire ile (satır sonunda ayrılmasın)
        lead: "İletişim, randevu, sipariş, iş başvurusu, destek talebi… Hazır formları markanıza uyarlıyor ve kendi hosting'inize kuruyoruz. Her cevap e-postanıza düzenli bir kart olarak gelir. Aylık form servisi ücreti ödemezsiniz; veriniz üçüncü bir firmadan geçmez.",
        primaryButton: "Teklif Alın",
        secondaryButton: "Formları Deneyin",
        note: "Açık kaynak sürümü ücretsiz indirilebilir · Apache 2.0",
        mockupCaption: "Formlar da bu sayfa gibi saf JavaScript ile çizilir.",
        mockupFormTitle: "Randevu Alın",
        mockupFields: ["HİZMET", "TARİH", "AD SOYAD", "E-POSTA"],
        mockupValues: ["İlk Görüşme · 45 dk", "14 Ekim, 10:30", "Ayşe Yılmaz", "ayse@ornek.com"],
        mockupButton: "GÖNDER",
        mockupMailTitle: "Yeni randevu",
        mockupMailRef: "APT-482913",
    },

    // STATS:
    stats: [
        { value: "8", label: "hazır form sayfası" },
        { value: "1 satır", label: "ile sitenize eklenir (iframe)" },
        { value: "1 PHP dosyası", label: "e-posta servisi, veri tabanı gerekmez" },
        { value: "₺0", label: "aylık form servisi ücreti" },
    ],

    // SERVICES:
    services: {
        eyebrow: "NE YAPIYORUZ",
        title: "Formunuzu hazırlıyor, kuruyor ve bağlıyoruz",
        lead: "İster hazır bir formu markanıza uyarlayalım, ister sıfırdan tasarlayalım; formunuz sizin sitenizde, cevapları sizin posta kutunuzda.",
        items: [
            {
                icon: "assets/icons/mail.png",
                title: "Kurulum ve e-posta servisi",
                text: "Hazır formlardan birini logonuz, renkleriniz ve metinlerinizle uyarlıyor; mail servisini kendi hosting'inize kuruyoruz. Formu sitenize ekleyip gerçek bir gönderimle test ediyoruz.",
                points: ["Hosting'inize kurulum", "SMTP ve spam ayarları", "Sitenize ekleme ve test"],
            },
            {
                icon: "assets/icons/brick.png",
                title: "Size özel form",
                text: "Başvuru, teklif isteme, rezervasyon, anket… İhtiyacınıza göre alanları, kuralları ve adımları tasarlıyoruz. Fiyat hesaplama, dosya yükleme ve koşullu alanlar dahil.",
                points: ["Doğrulamalı alanlar", "Hesaplama ve özet", "Dosya ve fotoğraf yükleme"],
            },
            {
                icon: "assets/icons/data-table.png",
                title: "Veri tabanı ve panel",
                text: "Cevaplar e-postanın yanında bir tabloya da kaydedilsin: Supabase, kendi API'niz veya veri tabanınız. İsterseniz gelen başvuruları izleyeceğiniz bir yönetim ekranı da ekliyoruz.",
                points: ["Supabase veya kendi API'niz", "Cevapları listeleme ekranı", "Excel / CSV dışa aktarma"],
            },
        ],
    },

    // FEATURES:
    features: {
        eyebrow: "ÖZELLİKLER",
        title: "Bir formda olması gereken her şey",
        lead: "Formlar basic.js ile, saf JavaScript ile yazılır. Framework ve derleme adımı yoktur; form tek bir sayfa olarak her hosting'de çalışır ve yıllar sonra da kolayca değiştirilir.",
        items: [
            { icon: "assets/icons/success.png", title: "Yazarken doğrulama", text: "Zorunlu alanlar, e-posta ve telefon biçimi yazarken kontrol edilir. Gönder düğmesi eksik alan sayısını gösterir; hatalı form hiç gönderilmez." },
            { icon: "assets/icons/mail.png", title: "Düzenli e-postalar", text: "Her cevap, formla aynı görünümde bir kart olarak gelir: başlık, referans numarası, tarih ve alanlar. \"Yanıtla\" doğrudan ziyaretçiye gider." },
            { icon: "assets/icons/extension.png", title: "Dosya yükleme", text: "Sürükle bırak ile CV, ekran görüntüsü veya belge yüklenir. Dosyalar e-postaya eklenir; boyut, sayı ve tür sınırlarını siz belirlersiniz." },
            { icon: "assets/icons/url.png", title: "Her siteye eklenir", text: "Form bağımsız bir sayfadır; iframe eklemeye izin veren her siteye tek satırla yerleşir: WordPress, Webflow, Wix, kendi siteniz." },
            { icon: "assets/icons/error.png", title: "Spam koruması", text: "Gizli tuzak alanı (honeypot), aynı adresten gönderim sınırı, sadece sizin sitenize açık servis ve form adı kontrolü." },
            { icon: "assets/icons/apps.png", title: "Telefonda da çalışır", text: "Formlar küçük ekrana uyum sağlar. Tarih seçici, ülke kodlu telefon alanı ve büyük dokunma alanlarıyla mobilde rahat doldurulur." },
            { icon: "assets/icons/light.png", title: "Markanıza göre", text: "Renk, logo, başlıklar ve bütün metinler düzenlenir; form istediğiniz dilde olur. E-postanın rengi de formla aynıdır." },
            { icon: "assets/icons/code.png", title: "Kodu ve veriniz sizin", text: "Cevaplar sizin posta kutunuza veya veri tabanınıza gider. Kaynak kodu teslimde size geçer; abonelik ve lisans kilidi yoktur." },
        ],
    },

    // USE CASES:
    useCases: {
        eyebrow: "KİMLER İÇİN",
        title: "Hazır form servislerine aylık ödemek istemeyenler için",
        lead: "",
        items: [
            { title: "Ajanslar ve web tasarımcılar", text: "Müşterilerinizin sitelerine iletişim ve teklif formları gerekiyor. Formu müşterinizin markasıyla, onun hosting'ine kuruyoruz; her ay bir form servisine ödeme yapmıyor." },
            { title: "Klinik, salon ve danışmanlar", text: "Hizmet, tarih ve saat seçilen randevu formu. Çalışma saatleri ve kapalı günler formda tanımlı; randevu isteği e-postanıza referans numarasıyla gelir." },
            { title: "Kafe, restoran ve küçük dükkânlar", text: "Ürün adetleri, kupon kodu ve toplam tutarın hesaplandığı sipariş formu. Pazaryeri komisyonu olmadan kendi sitenizden sipariş alın." },
            { title: "İK, etkinlik ve destek ekipleri", text: "CV yüklemeli iş başvurusu, bilet seçmeli etkinlik kaydı ve talep numarası veren destek formu. Hepsi aynı mail servisiyle çalışır." },
        ],
    },

    // PROCESS:
    process: {
        eyebrow: "NASIL İLERLİYOR",
        title: "Dört adımda yayında",
        lead: "",
        items: [
            { step: "01", title: "Kısa görüşme", text: "Hangi form, hangi alanlar ve cevapların nereye gideceğini konuşuyoruz: e-posta, veri tabanı veya ikisi birden.", time: "1. gün" },
            { step: "02", title: "Taslak ve teklif", text: "Formun alan listesi, görünüm taslağı, sabit fiyat ve teslim tarihi. Siz onaylamadan başlamıyoruz.", time: "1–2 gün" },
            { step: "03", title: "Geliştirme ve kurulum", text: "Form ve mail servisi kendi hosting'inize kurulur, sitenize eklenir, gerçek gönderimlerle test edilir.", time: "2–7 gün" },
            { step: "04", title: "Teslim ve destek", text: "Kaynak kodu ve kısa bir kullanım notu. Ardından paketinize göre ücretsiz düzeltme desteği.", time: "Teslim" },
        ],
    },

    // DEMO:
    demo: {
        eyebrow: "CANLI DEMO",
        title: "Formları kendiniz deneyin",
        lead: "Aşağıdakiler gerçek formlar, <b>demo modunda</b> çalışıyor: doldurup gönderebilirsiniz, hiçbir yere gönderilmez. Boş alan bırakıp gönder düğmesine bakın, dosya yükleyin, sipariş formunda bir kupon deneyin (WELCOME10).",
        frameTitle: "Formlar bu çerçevenin içinde açılır",
        startButton: "Demoyu Başlat",
        newTabButton: "Yeni Sekmede Aç",
        loadingText: "Form yükleniyor...",
        mobileWarning: "Formu tam ekranda görmek için \"Yeni Sekmede Aç\" düğmesini kullanın.",
        urlHost: "forms.siteniz.com",
        forms: {
            appointment: "Randevu",
            order: "Sipariş",
            feedback: "Geri Bildirim",
            recruitment: "İş Başvurusu",
            support: "Destek Talebi",
            event: "Etkinlik Kaydı",
        },
    },

    // PRICING:
    pricing: {
        eyebrow: "FİYATLAR",
        title: "Net kapsam, sabit fiyat",
        lead: "İş bazlı çalışıyoruz. Aşağıdakiler başlangıç fiyatlarıdır; kapsamı birlikte netleştiririz ve teklifte yazan fiyat iş sırasında değişmez.",
        popularLabel: "Önerilen",
        fromLabel: "başlangıç",
        items: [
            {
                name: "Açık Kaynak",
                price: "Ücretsiz",
                priceNote: "Apache 2.0",
                text: "Formları ve mail servisini indirin, kendiniz kurun.",
                points: ["8 hazır form sayfası", "PHP mail servisi (SMTP)", "Supabase örneği", "Kurulum rehberi", "GitHub üzerinden destek"],
                button: "GitHub'dan İndir",
                action: "download",
                packageIndex: 4,
                highlight: 0,
            },
            {
                name: "Kurulum",
                price: "₺7.500",
                priceNote: "başlangıç fiyatı",
                text: "Hazır bir form, markanıza uyarlanıp hosting'inize kurulur.",
                points: ["1 hazır form, marka uyarlaması", "Mail servisi kurulumu (SMTP)", "Sitenize ekleme ve test", "2–3 gün teslim", "1 ay ücretsiz düzeltme desteği"],
                button: "Teklif Alın",
                action: "contact",
                packageIndex: 1,
                highlight: 0,
            },
            {
                name: "Özel Form",
                price: "₺18.000",
                priceNote: "başlangıç fiyatı",
                text: "İhtiyacınıza göre sıfırdan tasarlanan form.",
                points: ["Size özel alanlar ve kurallar", "Hesaplama, özet, koşullu alanlar", "Dosya yükleme", "E-posta + veri tabanı kaydı", "3 ay ücretsiz düzeltme desteği"],
                button: "Teklif Alın",
                action: "contact",
                packageIndex: 2,
                highlight: 1,
            },
            {
                name: "Kurumsal",
                price: "Özel",
                priceNote: "görüşmeye göre",
                text: "Birden çok form, cevap paneli ve entegrasyonlar.",
                points: ["Birden çok form", "Cevapları izleme paneli", "API ve sistem entegrasyonu", "Kendi markanızla (white-label) teslim", "Sözleşmeli destek (SLA)"],
                button: "Görüşme Ayarlayın",
                action: "contact",
                packageIndex: 3,
                highlight: 0,
            },
        ],
        footNote: "Fiyatlar KDV hariçtir ve proje kapsamına göre teklifte netleşir. Hosting ve alan adı ücretleri size aittir.",
    },

    // OPEN SOURCE:
    openSource: {
        eyebrow: "AÇIK KAYNAK",
        title: "İsterseniz kendiniz kurun",
        lead: "JS Form, Apache 2.0 lisansı ile açık kaynak. İndirin, inceleyin, kendi ve müşteri projelerinizde ticari olarak kullanın. Kurulumda takılırsanız buradayız.",
        points: [
            "8 hazır form: iletişim, randevu, sipariş, geri bildirim, iş başvurusu, destek talebi, etkinlik kaydı",
            "Form bileşeni ve alanlar: metin, e-posta, telefon, tarih, seçenekler, dosya",
            "PHP mail servisi: SMTP (PHPMailer), dosya ekleri, spam koruması",
            "Supabase'e kayıt örneği ve SQL tablosu",
        ],
        primaryButton: "GitHub'da İncele",
        secondaryButton: "Kurulum Rehberi",
    },

    // FAQ:
    faq: {
        eyebrow: "SIKÇA SORULANLAR",
        title: "Merak edilenler",
        items: [
            { q: "Formu kendi siteme nasıl eklerim?", a: "Form bağımsız bir sayfadır. Sitenize tek satırlık bir iframe kodu ile eklenir; iframe eklemeye izin veren her sitede çalışır (WordPress, Webflow, Wix, kendi siteniz). İsterseniz formu doğrudan kendi adresinde de açabilirsiniz." },
            { q: "Cevaplar nereye gidiyor?", a: "Varsayılan olarak e-postanıza: mail servisi, cevabı formla aynı görünümde bir kart olarak gönderir ve dosyaları ekler. İsterseniz cevaplar Supabase'deki bir tabloya veya kendi API'nize de kaydedilir." },
            { q: "Aylık ücret ödeyecek miyiz?", a: "Hayır. Form ve mail servisi kendi hosting'inizde çalışır; bir form servisine abonelik yoktur. Sadece zaten ödediğiniz hosting ve alan adı ücretleri kalır." },
            { q: "Nasıl bir hosting gerekiyor?", a: "PHP 7.4 veya üstü ve hosting panelinizden açacağınız bir e-posta hesabı. Veri tabanı gerekmez. cPanel veya Plesk ile gelen paylaşımlı hosting'lerin neredeyse hepsi yeterlidir." },
            { q: "E-postalar spam'e düşer mi?", a: "Servis e-postayı kendi alan adınızdaki bir hesaptan (ör. no-reply@siteniz.com) SMTP ile gönderir ve ziyaretçinin adresini \"Yanıtla\" alanına koyar; bu, en güvenilir yöntemdir. Kurulumda gerçek gönderimlerle test ediyoruz." },
            { q: "Spam ve bot gönderimleri nasıl engelleniyor?", a: "Botların doldurduğu gizli bir tuzak alanı, aynı adresten art arda gönderim sınırı, servisin sadece sizin sitenize açılması ve izin verilen form adları. Hepsi servis dosyasının başındaki ayarlarla yönetilir." },
            { q: "Dosya yüklenebiliyor mu?", a: "Evet. CV, ekran görüntüsü veya belge sürükle bırak ile yüklenir ve e-postaya eklenir. Dosya boyutu, sayısı ve izin verilen türler ayarlanabilir." },
            { q: "KVKK açısından veriler nerede duruyor?", a: "Cevaplar sizin posta kutunuza veya veri tabanınıza gider; üçüncü bir form servisinden geçmez. Forma aydınlatma metni ve onay kutusu eklenebilir. Aydınlatma metni gibi KVKK yükümlülükleri veri sorumlusu olarak işletmenize aittir; bu konuda hukuki danışmanlık vermiyoruz." },
            { q: "Formu sonradan kendimiz değiştirebilir miyiz?", a: "Evet. Başlıklar, metinler, renkler ve alanlar formun sayfasında açıkça tanımlıdır. JavaScript bilen herkes yeni bir alan ekleyebilir; derleme adımı yoktur, dosyayı kaydedip yüklemek yeterlidir." },
            { q: "Hangi teknoloji kullanılıyor?", a: "Formlar saf JavaScript ile, basic.js adlı küçük ve bağımsız bir kütüphaneyle çizilir. React, Vue gibi bir framework veya paket yöneticisi yoktur. Mail servisi tek bir PHP dosyasıdır ve SMTP için PHPMailer kullanır." },
            { q: "Açık kaynak sürümle ne yapabilirim?", a: "Apache 2.0 lisansı ticari kullanıma izin verir; formları indirip kendi veya müşteri projelerinizde kullanabilirsiniz. Mail servisinin kullandığı PHPMailer ayrıca LGPL lisanslıdır. Kurulum desteği isterseniz bize yazın." },
            { q: "Ne kadar sürede teslim ediliyor?", a: "Hazır bir formun uyarlanıp kurulması genelde 2–3 gün, sıfırdan tasarlanan bir form yaklaşık bir hafta sürer. Teslim tarihi teklifte yazılı olarak belirlenir." },
        ],
    },

    // CONTACT:
    contact: {
        eyebrow: "İLETİŞİM",
        title: "Formunuzu anlatın",
        lead: "Birkaç satır yeterli. Genelde aynı gün, en geç ertesi iş günü dönüş yapıyoruz.",
        nameTitle: "AD SOYAD",
        namePlaceholder: "Ahmet Yılmaz",
        companyTitle: "ŞİRKET / SİTE",
        companyPlaceholder: "Şirket adı veya site adresi",
        emailTitle: "E-POSTA",
        emailPlaceholder: "ornek@sirket.com",
        emailWarning: "Geçerli bir e-posta adresi yazın",
        packageTitle: "İLGİLENDİĞİNİZ PAKET",
        packageList: ["Henüz emin değilim", "Kurulum", "Özel Form", "Kurumsal", "Açık kaynak / destek"],
        messageTitle: "FORMUNUZ",
        messagePlaceholder: "Ne tür bir form gerekiyor? Hangi alanlar olacak? Cevaplar nereye gitsin (e-posta, veri tabanı)? Siteniz hangi altyapıda (WordPress, Wix...)?",
        messageWarning: "Lütfen birkaç cümle yazın",
        requiredText: "Zorunlu",
        sendButton: "Gönder",
        sendingText: "Gönderiliyor...",
        successTitle: "Mesajınız ulaştı",
        successText: "Teşekkürler. En kısa sürede dönüş yapacağız.",
        errorTitle: "Gönderilemedi",
        errorText: "Bir sorun oluştu. Doğrudan e-posta ile yazabilirsiniz:",
        mailtoText: "Form servisi henüz ayarlanmadı; mesajınız e-posta programınızda açılıyor.",
        missingText: "Lütfen zorunlu alanları doldurun.",
        orText: "veya doğrudan yazın",
        closeButton: "Tamam",
    },

    // FOOTER:
    footer: {
        tagline: "Sitenize eklenen, cevapları e-postanıza gelen formlar.",
        columns: [
            { title: "Hizmet", links: [ { text: "Kurulum ve mail servisi", action: "services" }, { text: "Size özel form", action: "services" }, { text: "Veri tabanı ve panel", action: "services" }, { text: "Fiyatlar", action: "pricing" } ] },
            { title: "Ürün", links: [ { text: "Canlı demo", action: "demo" }, { text: "Özellikler", action: "features" }, { text: "Açık kaynak", action: "openSource" }, { text: "SSS", action: "faq" } ] },
        ],
        contactTitle: "İletişim",
        rights: "Tüm hakları saklıdır.",
        builtWith: "Bu site de formların kendisi gibi <b>basic.js</b> ile, saf JavaScript ile yazıldı.",
    },

};

// *** ENGLISH:
TEXTS.en = {

    langName: "EN",
    otherLangName: "TR",
    htmlLang: "en",

    // SEO:
    pageTitle: "Ready Web Forms for Your Site: Contact, Booking, Orders | JS Form",
    pageDescription: "Contact, booking, order, job application and support forms. Added to your site with one line; every answer arrives as a clean e-mail. No monthly form service fee; open source.",
    pageKeywords: "web form, contact form, booking form, order form, job application form, support ticket form, event registration form, form to email, php mail form, open source form, javascript form",

    // MENU:
    menu: {
        services: "Services",
        features: "Features",
        demo: "Demo",
        pricing: "Pricing",
        openSource: "Open Source",
        faq: "FAQ",
        contact: "Contact",
        cta: "Get a Quote",
        open: "Menu",
        close: "Close",
    },

    // HERO:
    hero: {
        eyebrow: "WEB FORMS · OPEN SOURCE",
        title: "Forms that sit on your site and send every answer to your inbox.",
        lead: "Contact, booking, orders, job applications, support tickets… We adapt ready forms to your brand and install them on your own hosting. Every answer arrives as a clean card in your e-mail. No monthly form service fee, and your data never passes through a third party.",
        primaryButton: "Get a Quote",
        secondaryButton: "Try the Forms",
        note: "The open source version is free to download · Apache 2.0",
        mockupCaption: "Like everything on this page, the forms are drawn with plain JavaScript.",
        mockupFormTitle: "Book an Appointment",
        mockupFields: ["SERVICE", "DATE", "FULL NAME", "E-MAIL"],
        mockupValues: ["First Consultation · 45 min", "Oct 14, 10:30", "Jack Brown", "jack@example.com"],
        mockupButton: "SEND",
        mockupMailTitle: "New appointment",
        mockupMailRef: "APT-482913",
    },

    // STATS:
    stats: [
        { value: "8", label: "ready form pages" },
        { value: "1 line", label: "to add it to your site (iframe)" },
        { value: "1 PHP file", label: "mail service, no database needed" },
        { value: "$0", label: "monthly form service fee" },
    ],

    // SERVICES:
    services: {
        eyebrow: "WHAT WE DO",
        title: "We build, install and connect your form",
        lead: "We adapt a ready form to your brand or design one from scratch. Either way the form lives on your site and the answers land in your inbox.",
        items: [
            {
                icon: "assets/icons/mail.png",
                title: "Setup and mail service",
                text: "We adapt one of the ready forms with your logo, colors and texts, and install the mail service on your own hosting. Then we add the form to your site and test it with a real submission.",
                points: ["Installed on your hosting", "SMTP and spam settings", "Added to your site and tested"],
            },
            {
                icon: "assets/icons/brick.png",
                title: "A form made for you",
                text: "Applications, quote requests, reservations, surveys… We design the fields, rules and steps you need, including price calculations, file uploads and conditional fields.",
                points: ["Validated fields", "Calculations and summary", "File and photo uploads"],
            },
            {
                icon: "assets/icons/data-table.png",
                title: "Database and panel",
                text: "Keep the answers in a table as well as in your inbox: Supabase, your own API or database. If you like, we add a screen to follow the submissions too.",
                points: ["Supabase or your own API", "A screen to list the answers", "Excel / CSV export"],
            },
        ],
    },

    // FEATURES:
    features: {
        eyebrow: "FEATURES",
        title: "Everything a form needs",
        lead: "The forms are written in plain JavaScript with basic.js. There is no framework and no build step: each form is one page that runs on any hosting and stays easy to change for years.",
        items: [
            { icon: "assets/icons/success.png", title: "Checks while typing", text: "Required fields, e-mail and phone formats are checked as the visitor types. The send button shows how many fields are missing, so a broken form is never sent." },
            { icon: "assets/icons/mail.png", title: "Clean e-mails", text: "Every answer arrives as a card in the same style as the form: title, reference number, date and fields. \"Reply\" goes straight to the visitor." },
            { icon: "assets/icons/extension.png", title: "File uploads", text: "CVs, screenshots and documents are dropped into the form and attached to the e-mail. You decide the size, count and type limits." },
            { icon: "assets/icons/url.png", title: "Fits any site", text: "A form is a standalone page, so one line adds it to any site that allows an iframe: WordPress, Webflow, Wix or your own site." },
            { icon: "assets/icons/error.png", title: "Spam protection", text: "A hidden trap field (honeypot), a limit on repeated posts from one address, a service open only to your site, and a check of the form names." },
            { icon: "assets/icons/apps.png", title: "Works on phones", text: "The forms adapt to small screens. A date picker, a phone field with the country code and large touch targets make them easy to fill on mobile." },
            { icon: "assets/icons/light.png", title: "Your brand", text: "Colors, logo, titles and every text can be changed, so the form speaks your language. The e-mail uses the color of the form too." },
            { icon: "assets/icons/code.png", title: "Your code, your data", text: "The answers go to your inbox or your database. You get the full source code; no subscription, no license lock." },
        ],
    },

    // USE CASES:
    useCases: {
        eyebrow: "WHO IT IS FOR",
        title: "For anyone tired of paying monthly for forms",
        lead: "",
        items: [
            { title: "Agencies and web designers", text: "Your clients' sites need contact and quote forms. We install them with your client's brand on their hosting, so nobody pays a form service every month." },
            { title: "Clinics, salons and consultants", text: "A booking form with the service, the date and the time. Opening hours and closed days are set in the form, and each request reaches you with a reference number." },
            { title: "Cafés, restaurants and small shops", text: "An order form that counts the items, applies coupon codes and shows the total. Take orders on your own site without marketplace fees." },
            { title: "HR, event and support teams", text: "Job applications with CV upload, event registration with ticket types, and a support form that gives a ticket number. All with the same mail service." },
        ],
    },

    // PROCESS:
    process: {
        eyebrow: "HOW IT WORKS",
        title: "Live in four steps",
        lead: "",
        items: [
            { step: "01", title: "Short call", text: "Which form, which fields and where the answers should go: e-mail, a database or both.", time: "Day 1" },
            { step: "02", title: "Draft and quote", text: "The field list, a design draft, a fixed price and a delivery date. Nothing starts before you approve.", time: "1–2 days" },
            { step: "03", title: "Build and install", text: "The form and the mail service are installed on your hosting, added to your site and tested with real submissions.", time: "2–7 days" },
            { step: "04", title: "Delivery and support", text: "The source code and a short usage note, followed by free fixes for the period of your package.", time: "Delivery" },
        ],
    },

    // DEMO:
    demo: {
        eyebrow: "LIVE DEMO",
        title: "Try the forms yourself",
        lead: "These are the real forms, running in <b>demo mode</b>: fill them in and send them, nothing is sent anywhere. Leave a field empty and watch the send button, upload a file, or try a coupon in the order form (WELCOME10).",
        frameTitle: "The forms open inside this frame",
        startButton: "Start the Demo",
        newTabButton: "Open in a New Tab",
        loadingText: "Loading the form...",
        mobileWarning: "Use \"Open in a New Tab\" to see the form on the full screen.",
        urlHost: "forms.your-site.com",
        forms: {
            appointment: "Booking",
            order: "Order",
            feedback: "Feedback",
            recruitment: "Job Application",
            support: "Support Ticket",
            event: "Event Registration",
        },
    },

    // PRICING:
    pricing: {
        eyebrow: "PRICING",
        title: "Clear scope, fixed price",
        lead: "We work per project. These are starting prices; we agree on the scope together, and the price in the quote does not change during the work.",
        popularLabel: "Recommended",
        fromLabel: "from",
        items: [
            {
                name: "Open Source",
                price: "Free",
                priceNote: "Apache 2.0",
                text: "Download the forms and the mail service, install them yourself.",
                points: ["8 ready form pages", "PHP mail service (SMTP)", "Supabase example", "Setup guide", "Support on GitHub"],
                button: "Download on GitHub",
                action: "download",
                packageIndex: 4,
                highlight: 0,
            },
            {
                name: "Setup",
                price: "$250",
                priceNote: "starting price",
                text: "A ready form, adapted to your brand and installed on your hosting.",
                points: ["1 ready form, brand adaptation", "Mail service setup (SMTP)", "Added to your site and tested", "Delivered in 2–3 days", "1 month of free fixes"],
                button: "Get a Quote",
                action: "contact",
                packageIndex: 1,
                highlight: 0,
            },
            {
                name: "Custom Form",
                price: "$600",
                priceNote: "starting price",
                text: "A form designed from scratch for what you need.",
                points: ["Your own fields and rules", "Calculations, summary, conditional fields", "File uploads", "E-mail + database record", "3 months of free fixes"],
                button: "Get a Quote",
                action: "contact",
                packageIndex: 2,
                highlight: 1,
            },
            {
                name: "Business",
                price: "Custom",
                priceNote: "after a call",
                text: "Several forms, a panel for the answers and integrations.",
                points: ["Several forms", "A panel to follow the answers", "API and system integrations", "White-label delivery", "Support contract (SLA)"],
                button: "Book a Call",
                action: "contact",
                packageIndex: 3,
                highlight: 0,
            },
        ],
        footNote: "Prices exclude VAT and are finalized in the quote based on the scope. Hosting and domain fees are yours.",
    },

    // OPEN SOURCE:
    openSource: {
        eyebrow: "OPEN SOURCE",
        title: "Prefer to install it yourself?",
        lead: "JS Form is open source under the Apache 2.0 license. Download it, read it, and use it commercially in your own and your clients' projects. If you get stuck during the setup, we are here.",
        points: [
            "8 ready forms: contact, booking, order, feedback, job application, support ticket, event registration",
            "The form component and its fields: text, e-mail, phone, date, choices, files",
            "PHP mail service: SMTP (PHPMailer), attachments, spam protection",
            "An example that saves to Supabase, with its SQL table",
        ],
        primaryButton: "View on GitHub",
        secondaryButton: "Setup Guide",
    },

    // FAQ:
    faq: {
        eyebrow: "FAQ",
        title: "Common questions",
        items: [
            { q: "How do I add a form to my site?", a: "A form is a standalone page. One line of iframe code adds it to your site, and it works on any site that allows an iframe (WordPress, Webflow, Wix, your own site). You can also open the form on its own address." },
            { q: "Where do the answers go?", a: "To your e-mail by default: the mail service sends each answer as a card in the same style as the form, with the uploaded files attached. The answers can also be saved to a Supabase table or your own API." },
            { q: "Is there a monthly fee?", a: "No. The form and the mail service run on your own hosting, so there is no form service subscription. Only the hosting and domain fees you already pay remain." },
            { q: "What kind of hosting do I need?", a: "PHP 7.4 or newer and an e-mail account you create in your hosting panel. No database is needed. Almost every shared hosting with cPanel or Plesk is enough." },
            { q: "Will the e-mails end up in spam?", a: "The service sends from an account on your own domain (for example no-reply@your-site.com) over SMTP and puts the visitor's address in \"Reply-To\", which is the most reliable setup. We test it with real submissions during the installation." },
            { q: "How are spam and bots stopped?", a: "A hidden trap field that bots fill in, a limit on repeated posts from the same address, a service open only to your site, and a list of allowed form names. All of them are settings at the top of the service file." },
            { q: "Can visitors upload files?", a: "Yes. CVs, screenshots and documents are dropped into the form and attached to the e-mail. The file size, the number of files and the allowed types can be set." },
            { q: "Where is the data kept (GDPR)?", a: "The answers go to your inbox or your database, never through a third-party form service. A privacy notice and a consent checkbox can be added to any form. The legal duties of a data controller stay with your business; we do not give legal advice." },
            { q: "Can we change the form later ourselves?", a: "Yes. Titles, texts, colors and fields are defined plainly in the form's page. Anyone who knows JavaScript can add a field; there is no build step, you save the file and upload it." },
            { q: "What technology is used?", a: "The forms are drawn with plain JavaScript and basic.js, a small, independent library. There is no framework like React or Vue and no package manager. The mail service is a single PHP file that uses PHPMailer for SMTP." },
            { q: "What can I do with the open source version?", a: "The Apache 2.0 license allows commercial use: download the forms and use them in your own or your clients' projects. PHPMailer, used by the mail service, is licensed under the LGPL. Write to us if you want help with the setup." },
            { q: "How long does it take?", a: "Adapting and installing a ready form usually takes 2–3 days; a form designed from scratch takes about a week. The delivery date is written in the quote." },
        ],
    },

    // CONTACT:
    contact: {
        eyebrow: "CONTACT",
        title: "Tell us about your form",
        lead: "A few lines are enough. We usually reply the same day, at the latest the next business day.",
        nameTitle: "FULL NAME",
        namePlaceholder: "Jane Smith",
        companyTitle: "COMPANY / SITE",
        companyPlaceholder: "Company name or site address",
        emailTitle: "E-MAIL",
        emailPlaceholder: "you@company.com",
        emailWarning: "Enter a valid e-mail address",
        packageTitle: "PACKAGE YOU ARE INTERESTED IN",
        packageList: ["Not sure yet", "Setup", "Custom Form", "Business", "Open source / support"],
        messageTitle: "YOUR FORM",
        messagePlaceholder: "What kind of form do you need? Which fields? Where should the answers go (e-mail, database)? What is your site built with (WordPress, Wix...)?",
        messageWarning: "Please write a few sentences",
        requiredText: "Required",
        sendButton: "Send",
        sendingText: "Sending...",
        successTitle: "Your message arrived",
        successText: "Thank you. We will get back to you soon.",
        errorTitle: "Could not send",
        errorText: "Something went wrong. You can e-mail us directly:",
        mailtoText: "The form service is not set up yet; your message opens in your e-mail app.",
        missingText: "Please fill in the required fields.",
        orText: "or write to us directly",
        closeButton: "OK",
    },

    // FOOTER:
    footer: {
        tagline: "Forms that sit on your site and send every answer to your inbox.",
        columns: [
            { title: "Services", links: [ { text: "Setup and mail service", action: "services" }, { text: "A form made for you", action: "services" }, { text: "Database and panel", action: "services" }, { text: "Pricing", action: "pricing" } ] },
            { title: "Product", links: [ { text: "Live demo", action: "demo" }, { text: "Features", action: "features" }, { text: "Open source", action: "openSource" }, { text: "FAQ", action: "faq" } ] },
        ],
        contactTitle: "Contact",
        rights: "All rights reserved.",
        builtWith: "Like the forms, this site is written in plain JavaScript with <b>basic.js</b>.",
    },

};
