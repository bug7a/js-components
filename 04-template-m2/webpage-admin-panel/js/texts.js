/* Bismillah */

/*

Web Admin Panel - Site Texts (TR / EN) - v26.09

- Sitedeki bütün metinler burada. Sayfayı düzenlemek için buradan başlayın.
- All site copy lives here. Start here to edit the page.

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
    pageTitle: "Özel Admin Panel ve Dashboard Geliştirme | JS Admin Panel",
    pageDescription: "İşletmeniz, uygulamanız veya müşterileriniz için özel admin paneli ve dashboard. Sabit fiyat, 2–4 haftada teslim; kaynak kodu ve veriniz sizde kalır.",
    pageKeywords: "admin panel, yönetim paneli, özel admin panel, yönetim paneli yazılımı, dashboard geliştirme, rapor paneli, raporlama ekranı, özel yazılım, excel yerine panel, javascript admin panel, açık kaynak admin panel",

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
        eyebrow: "ÖZEL ADMIN PANEL & DASHBOARD",
        title: "İşinize özel yönetim paneli,<br>birkaç hafta içinde hazır.",
        lead: "Uygulamanızın içeriğini, müşterilerinizi, siparişlerinizi veya raporlarınızı tek ekrandan yönetin. Mobil uygulama stüdyoları, ajanslar ve işletmeler için sabit fiyatla, size özel paneller geliştiriyoruz. Panel kendi sunucunuzda çalışır; kaynak kodu da veriniz de sizde kalır.",
        primaryButton: "Teklif Alın",
        secondaryButton: "Canlı Demoyu Görün",
        note: "Açık kaynak sürümü ücretsiz indirilebilir · Apache 2.0",
        mockupCaption: "Bu sayfadaki her şey gibi, panel de saf JavaScript ile çizilir.",
    },

    // STATS:
    stats: [
        { value: "2–4 hafta", label: "tipik teslim süresi" },
        { value: "Sabit fiyat", label: "teklifte yazılı, sürpriz yok" },
        { value: "%100", label: "kaynak kodu sizde" },
        { value: "₺0", label: "lisans veya abonelik ücreti" },
    ],

    // SERVICES:
    services: {
        eyebrow: "NE YAPIYORUZ",
        title: "Üç tür iş alıyoruz",
        lead: "Hepsinin ortak noktası aynı: hızlı açılan, kullanımı kolay, bakımı ucuz ekranlar.",
        items: [
            {
                icon: "assets/icons/dashboard.png",
                title: "Uygulamanız için admin paneli",
                text: "Mobil veya web uygulamanızın içerik, kullanıcı, bildirim ve ayar yönetimi. Uygulamanızı yayınladınız ama arkasında bir yönetim ekranı yoksa, sade bir panel yaklaşık iki haftada hazır olur.",
                points: ["Kullanıcı ve içerik yönetimi", "Bildirim gönderme", "Rol ve yetkilendirme"],
            },
            {
                icon: "assets/icons/reports.png",
                title: "Verileriniz için rapor ve dashboard",
                text: "Satış, sipariş, stok veya kullanıcı verileriniz Excel dosyalarına, veri tabanına ya da farklı yazılımlara dağılmışsa; takip ettiğiniz metrikleri tek ekranda, güncel olarak görün. Pahalı BI lisanslarına gerek kalmaz.",
                points: ["Güncel metrik kartları", "Tablo ve grafik raporları", "Excel / CSV içe ve dışa aktarma"],
            },
            {
                icon: "assets/icons/brick.png",
                title: "Mevcut panelinize modül",
                text: "Panelin iskeleti modüler. Her modül kendi başına çalışan bağımsız bir sayfadır ve panelin içine yerleşir. Paneliniz, çalışan kodunuza dokunulmadan büyür.",
                points: ["Bağımsız modüller", "Farklı teknolojilerle uyumlu", "Mevcut kodu bozmaz"],
            },
        ],
    },

    // FEATURES:
    features: {
        eyebrow: "ÖZELLİKLER",
        title: "Panelinizde neler olabilir?",
        lead: "Her panel ihtiyaca göre şekillenir; aşağıdakiler her projede sunabildiğimiz temeller. Arayüz, basic.js ile saf JavaScript kullanılarak yazılır. Framework ve derleme adımı olmadığı için panel yıllar sonra da kolayca bakılabilir kalır.",
        items: [
            { icon: "assets/icons/bolt.png", title: "Hafif ve hızlı", text: "Harici bağımlılık yok, dosyalar küçük; panel hemen açılır. Kütüphane güncellemeleri paneli bozmaz, bakım masrafı düşük kalır." },
            { icon: "assets/icons/extension.png", title: "Modüler yapı", text: "Her modül bağımsız bir sayfa. Yeni bir modül eklemek, çalışan hiçbir şeyi yeniden yazmayı gerektirmez." },
            { icon: "assets/icons/data-table.png", title: "Tabloda düzenleme", text: "Kayıtları tablo hâlinde görün, hücreye tıklayıp düzenleyin; filtreleyin, arayın, Excel'e aktarın." },
            { icon: "assets/icons/user.png", title: "Giriş ve yetkiler", text: "E-posta/şifre, Google veya Apple ile giriş. Kimin hangi ekranı göreceğine ve neyi değiştirebileceğine siz karar verirsiniz." },
            { icon: "assets/icons/url.png", title: "Veriniz sizin sunucunuzda", text: "Panel verinize doğrudan sizin altyapınızdan erişir; veriler bizim sunucumuzdan geçmez. Supabase, REST API, SQL sunucunuz veya mevcut sisteminiz." },
            { icon: "assets/icons/light.png", title: "Markanıza göre tema", text: "Renk, logo, yazı tipi ve koyu tema; panel sizin ya da müşterinizin markasıyla uyumlu görünür." },
            { icon: "assets/icons/apps.png", title: "Türkçe arayüz", text: "Menüler, uyarılar, tarih ve para biçimleri Türkçe. İhtiyaç varsa İngilizce veya başka dillerde de." },
            { icon: "assets/icons/code.png", title: "Kaynak kodu sizin", text: "Teslimde kodun tamamı size geçer. Tek bir firmaya bağlı kalmazsınız, abonelik zorunluluğu yoktur." },
        ],
    },

    // USE CASES:
    useCases: {
        eyebrow: "KİMLER İÇİN",
        title: "Hazır yazılıma sığmayan işler için",
        lead: "",
        items: [
            { title: "Reklam ajansları", text: "Müşteriniz için uygulama veya site yaptınız, içeriği kendisi yönetsin istiyorsunuz. Paneli sizin markanızla (white-label) teslim ediyoruz; siz de müşterinize kendi işiniz olarak sunuyorsunuz." },
            { title: "Mobil uygulama stüdyoları", text: "Uygulama hazır ama arkasında bir yönetim ekranı yok. Ekibinizi panel yazmaya ayırmak yerine bu işi dışarıdan alın, siz ürününüze odaklanın." },
            { title: "KOBİ'ler ve e-ticaret", text: "Sipariş, stok, müşteri ve kampanya takibi Excel dosyalarına mı dağıldı? API'si veya veri tabanı erişimi olan sistemlerinizdeki verileri toplayıp ekibinizin kullanacağı sade ekranlar hazırlıyoruz." },
            { title: "SaaS ve teknoloji firmaları", text: "Destek ve operasyon ekibinizin kullanacağı iç araçlar: kullanıcı arama, abonelik düzeltme, kayıt inceleme. Ana ürününüzü yavaşlatmadan." },
        ],
    },

    // PROCESS:
    process: {
        eyebrow: "NASIL İLERLİYOR",
        title: "Dört adımda teslim",
        lead: "",
        items: [
            { step: "01", title: "Keşif görüşmesi", text: "30 dakika. Hangi verinin, kim tarafından, hangi ekranda yönetileceğini konuşuyoruz.", time: "1. gün" },
            { step: "02", title: "Ekran planı ve teklif", text: "Modül listesi, ekran taslakları, sabit fiyat ve teslim tarihi. Siz onaylamadan başlamıyoruz.", time: "2–3 gün" },
            { step: "03", title: "Geliştirme", text: "Her hafta çalışan bir sürümü birlikte inceliyoruz. Panel kendi sunucunuzda, kendi verinizle kurulur.", time: "2–4 hafta" },
            { step: "04", title: "Teslim ve destek", text: "Kaynak kodu, kurulum dokümanı ve kullanım eğitimi. Ardından paketinize göre 1–3 ay ücretsiz düzeltme desteği.", time: "Teslim" },
        ],
    },

    // DEMO:
    demo: {
        eyebrow: "CANLI DEMO",
        title: "Panele kendiniz göz atın",
        lead: "Aşağıdaki, gerçek panelin çalışan bir kopyası. Giriş bilgileri hazır gelir; <b>Giriş yap</b> demeniz yeterli. Sol menüden modüller arasında dolaşabilir, tabloda kayıt düzenleyebilirsiniz.",
        frameTitle: "Gerçek panel, bu çerçevenin içinde açılır",
        startButton: "Demoyu Başlat",
        newTabButton: "Yeni Sekmede Aç",
        loadingText: "Panel yükleniyor...",
        mobileWarning: "Panel masaüstü ekranlar için tasarlandı. Demoyu bilgisayarınızdan açmanızı öneririz.",
    },

    // PRICING:
    pricing: {
        eyebrow: "FİYATLAR",
        title: "Net kapsam, sabit fiyat",
        lead: "Saatlik değil, iş bazlı çalışıyoruz. Aşağıdakiler başlangıç fiyatlarıdır; kapsamı birlikte netleştiririz ve teklifte yazan fiyat iş sırasında değişmez.",
        popularLabel: "Önerilen",
        fromLabel: "başlangıç",
        items: [
            {
                name: "Açık Kaynak",
                price: "Ücretsiz",
                priceNote: "Apache 2.0",
                text: "Panelin iskeletini indirin, kendiniz kurun.",
                points: ["Tam kaynak kodu", "Modüler iskelet", "Örnek sayfalar ve bileşenler", "GitHub üzerinden destek"],
                button: "GitHub'dan İndir",
                action: "download",
                packageIndex: 4,
                highlight: 0,
            },
            {
                name: "Başlangıç",
                price: "₺45.000",
                priceNote: "başlangıç fiyatı",
                text: "Tek bir uygulamanın yönetimi için sade bir panel.",
                points: ["1 modül, 3 veri tablosuna kadar", "Giriş ekranı ve kullanıcı yönetimi", "Temel tema uyarlaması", "2 hafta teslim", "1 ay ücretsiz düzeltme desteği"],
                button: "Teklif Alın",
                action: "contact",
                packageIndex: 1,
                highlight: 0,
            },
            {
                name: "Profesyonel",
                price: "₺95.000",
                priceNote: "başlangıç fiyatı",
                text: "Birden çok modül, roller ve raporlarla tam panel.",
                points: ["5 modüle kadar", "Rol ve yetkilendirme", "Dashboard ve rapor ekranları", "Markanıza özel tema", "Mevcut veri tabanı / API bağlantısı", "3 ay ücretsiz düzeltme desteği"],
                button: "Teklif Alın",
                action: "contact",
                packageIndex: 2,
                highlight: 1,
            },
            {
                name: "Kurumsal",
                price: "Özel",
                priceNote: "görüşmeye göre",
                text: "Sınırsız modül, özel entegrasyon ve sürekli geliştirme.",
                points: ["Sınırsız modül", "Özel entegrasyonlar", "Kendi markanızla (white-label) teslim", "Ekip eğitimi", "Sözleşmeli destek (SLA)"],
                button: "Görüşme Ayarlayın",
                action: "contact",
                packageIndex: 3,
                highlight: 0,
            },
        ],
        footNote: "Fiyatlar KDV hariçtir ve proje kapsamına göre teklifte netleşir.",
    },

    // OPEN SOURCE:
    openSource: {
        eyebrow: "AÇIK KAYNAK",
        title: "İsterseniz kendiniz kurun",
        lead: "Panelin iskeleti Apache 2.0 lisansı ile açık kaynak. İndirin, inceleyin, ticari projelerinizde kullanın. Yardıma ihtiyacınız olursa buradayız.",
        points: [
            "Panel iskeleti: sol menü, üst bar, modül sistemi, giriş ekranı",
            "40'tan fazla hazır arayüz bileşeni",
            "Örnek sayfalar, şablonlar ve el kitabı",
            "Ticari kullanıma açık, lisans ve telif bildirimini korumanız yeterli",
        ],
        primaryButton: "GitHub'da İncele",
        secondaryButton: "El Kitabını Aç",
    },

    // FAQ:
    faq: {
        eyebrow: "SIKÇA SORULANLAR",
        title: "Merak edilenler",
        items: [
            { q: "Ne kadar sürede teslim ediliyor?", a: "Tek modüllü sade bir panel yaklaşık 2 hafta, çok modüllü ve raporlu bir panel 3–4 hafta sürer. Teslim tarihi teklifte yazılı olarak belirlenir." },
            { q: "Kaynak kodu bizde mi kalıyor?", a: "Evet. Teslimde kodun tamamı size geçer; istediğiniz gibi değiştirir, dilediğiniz sunucuda çalıştırırsınız. Abonelik veya lisans kilidi yok, başka bir yazılımcıyla da devam edebilirsiniz." },
            { q: "KVKK açısından verilerimiz nerede duruyor?", a: "Panel sizin sunucunuzda çalışır ve verilerinize doğrudan sizin altyapınızdan erişir; veriler bizim sunucularımızdan geçmez. Kimin hangi veriyi görebileceği kullanıcı yetkileriyle sınırlanır. Aydınlatma metni, VERBİS kaydı gibi KVKK yükümlülükleri veri sorumlusu olarak işletmenize aittir; bu konuda hukuki danışmanlık vermiyoruz." },
            { q: "Kendi veri tabanımızı bağlayabilir miyiz?", a: "Evet. Panel, veriyi nereden aldığından bağımsız çalışır: Supabase, Firebase, REST API, GraphQL veya kendi SQL sunucunuz. Erişim izni olan bir ERP'nin (ör. Logo, Mikro) veri tabanından veya API'sinden rapor ekranları da hazırlanabilir; bunu keşif görüşmesinde birlikte inceliyoruz." },
            { q: "Excel'deki verilerimizi panele aktarabilir miyiz?", a: "Evet. Mevcut Excel veya CSV dosyalarınız ilk kurulumda panele aktarılabilir. İhtiyacınız varsa panele kalıcı bir içe ve dışa aktarma ekranı da eklenir." },
            { q: "Sunucumuz yok, ne yapmalıyız?", a: "Panel sade dosyalardan oluştuğu için neredeyse her hosting hizmetinde çalışır. Veri tarafı için Supabase gibi hazır bir servis veya Türkiye'deki bir sunucu kullanılabilir; size uygun seçeneği keşif görüşmesinde birlikte belirliyoruz." },
            { q: "Teslimden sonra ücret ödeyecek miyiz?", a: "Bize ödeyeceğiniz zorunlu bir aylık ücret yok. Pakete dahil ücretsiz düzeltme süresinden sonra yeni modül, değişiklik veya bakım isterseniz ayrıca teklif veriyoruz. Sunucu ve veri servisi masrafları varsa doğrudan sizin hesabınızdan ödenir." },
            { q: "Panel mobilde çalışıyor mu?", a: "Panel masaüstü ekranlar için tasarlandı; asıl kullanım senaryosu bilgisayar başında veri yönetmek. Mobil uyumlu özel ekranlar da yapılabilir, bunu keşif görüşmesinde konuşuyoruz." },
            { q: "Mevcut panelimize modül eklenebilir mi?", a: "Paneliniz bu iskelet üzerine kuruluysa doğrudan eklenir. Değilse modülü bağımsız bir sayfa olarak geliştirip mevcut panelinizin içine yerleştirebiliriz; çalışan kodunuza dokunmadan." },
            { q: "Kendi markamızla (white-label) teslim yapıyor musunuz?", a: "Evet. Ajansların sık tercih ettiği bir yöntem: panel sizin markanızla teslim edilir, biz görünmeyiz. Kurumsal pakette standart olarak sunulur." },
            { q: "Panel hangi teknolojiyle yazılıyor?", a: "Saf JavaScript ile. Arayüz, basic.js adlı küçük ve bağımsız bir kütüphane ile çiziliyor. React, Vue veya Angular gibi bir framework, derleme adımı veya paket yöneticisi yok. Bu yüzden panel küçük kalıyor, yıllar sonra da aynı şekilde çalışıyor ve JavaScript bilen her yazılımcı üzerinde çalışabiliyor." },
            { q: "Açık kaynak sürümle ne yapabilirim?", a: "Apache 2.0 lisansı ticari kullanıma izin verir; indirip kendi veya müşteri projelerinizde kullanabilirsiniz. Kurulum ve özelleştirme desteği isterseniz bize yazın." },
        ],
    },

    // CONTACT:
    contact: {
        eyebrow: "İLETİŞİM",
        title: "Projenizi anlatın",
        lead: "Birkaç satır yeterli. Genelde aynı gün, en geç ertesi iş günü dönüş yapıyoruz.",
        nameTitle: "AD SOYAD",
        namePlaceholder: "Ahmet Yılmaz",
        companyTitle: "ŞİRKET",
        companyPlaceholder: "Şirket adı",
        emailTitle: "E-POSTA",
        emailPlaceholder: "ornek@sirket.com",
        emailWarning: "Geçerli bir e-posta adresi yazın",
        packageTitle: "İLGİLENDİĞİNİZ PAKET",
        packageList: ["Henüz emin değilim", "Başlangıç", "Profesyonel", "Kurumsal", "Açık kaynak / destek"],
        messageTitle: "PROJENİZ",
        messagePlaceholder: "Ne tür bir panel gerekiyor? Hangi verileri yöneteceksiniz? Bu işi şu an nasıl yapıyorsunuz (Excel, hazır yazılım...)?",
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
        tagline: "İşinize özel admin panelleri ve dashboard'lar.",
        columns: [
            { title: "Hizmet", links: [ { text: "Admin paneli", action: "services" }, { text: "Rapor & dashboard", action: "services" }, { text: "Modül geliştirme", action: "services" }, { text: "Fiyatlar", action: "pricing" } ] },
            { title: "Ürün", links: [ { text: "Canlı demo", action: "demo" }, { text: "Özellikler", action: "features" }, { text: "Açık kaynak", action: "openSource" }, { text: "SSS", action: "faq" } ] },
        ],
        contactTitle: "İletişim",
        rights: "Tüm hakları saklıdır.",
        builtWith: "Bu site de panelin kendisi gibi <b>basic.js</b> ile, saf JavaScript ile yazıldı.",
    },

};

// *** ENGLISH:
TEXTS.en = {

    langName: "EN",
    otherLangName: "TR",
    htmlLang: "en",

    // SEO:
    pageTitle: "Custom Admin Panels & Dashboards | JS Admin Panel",
    pageDescription: "Lightweight, framework-free, fully custom admin panels and dashboards for app studios, agencies and technology companies. You own the source code and it runs on your own server.",
    pageKeywords: "admin panel, custom admin panel, dashboard development, reporting panel, javascript admin panel, open source admin panel, lightweight admin dashboard",

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
        eyebrow: "CUSTOM ADMIN PANELS & DASHBOARDS",
        title: "The admin panel your app needs.<br>Nothing more.",
        lead: "We build lightweight, framework-free admin panels for app studios, agencies and technology companies. It runs on your own server, and the source code is yours.",
        primaryButton: "Get a Quote",
        secondaryButton: "See the Live Demo",
        note: "The open source edition is free to download · Apache 2.0",
        mockupCaption: "Like everything on this page, the panel is drawn in plain JavaScript.",
    },

    // STATS:
    stats: [
        { value: "0", label: "external dependencies" },
        { value: "~120 KB", label: "total panel size" },
        { value: "2–4 weeks", label: "typical delivery" },
        { value: "Apache 2.0", label: "open source license" },
    ],

    // SERVICES:
    services: {
        eyebrow: "WHAT WE DO",
        title: "We take on three kinds of work",
        lead: "They all share the same goal: small, fast, easy-to-maintain screens.",
        items: [
            {
                icon: "assets/icons/dashboard.png",
                title: "An admin panel for your app",
                text: "Content, users, notifications and settings for your mobile or web app. If your app is live but has no back office behind it, you can have one in two weeks.",
                points: ["User and content management", "Push notifications", "Roles and permissions"],
            },
            {
                icon: "assets/icons/reports.png",
                title: "Reports and dashboards for your database",
                text: "Leave your data where it is. Track the handful of metrics you actually need, laid out your way, on a screen that opens in a second. No heavyweight BI tool required.",
                points: ["Live metric cards", "Table and chart reports", "CSV / Excel export"],
            },
            {
                icon: "assets/icons/brick.png",
                title: "A module for your existing panel",
                text: "The skeleton is modular. Each module is an independent page written in whatever technology you like, dropped into the panel. It grows without touching the code that already works.",
                points: ["Independent modules", "Technology agnostic", "Leaves existing code alone"],
            },
        ],
    },

    // FEATURES:
    features: {
        eyebrow: "FEATURES",
        title: "Why is it this light?",
        lead: "The panel is built with basic.js: the entire interface is drawn directly in plain JavaScript. No HTML templates, no CSS files, no build step, no virtual DOM.",
        items: [
            { icon: "assets/icons/bolt.png", title: "No framework", text: "Zero external dependencies. No upgrade treadmill, no node_modules, no build queue." },
            { icon: "assets/icons/extension.png", title: "Modular architecture", text: "Every module is an independent page. Adding one never means rewriting what already works." },
            { icon: "assets/icons/data-table.png", title: "Edit in the table", text: "See records as a list, click a cell to edit it, filter and search without leaving the page." },
            { icon: "assets/icons/user.png", title: "Login and permissions", text: "Email/password, Google and Apple sign-in, with role-based access to screens and actions." },
            { icon: "assets/icons/url.png", title: "Your own data", text: "Supabase, a REST API, your own SQL server or an existing back end. The data stays with you." },
            { icon: "assets/icons/light.png", title: "Themed for your brand", text: "Colors, logo, typography and dark mode, so the panel matches your client's brand." },
            { icon: "assets/icons/apps.png", title: "Opens instantly", text: "Small files, single page application. The panel is usable the moment it appears." },
            { icon: "assets/icons/code.png", title: "You own the code", text: "The full source is handed over on delivery. No lock-in, no mandatory subscription." },
        ],
    },

    // USE CASES:
    useCases: {
        eyebrow: "WHO IT IS FOR",
        title: "Teams that need a small panel",
        lead: "",
        items: [
            { title: "Advertising agencies", text: "You built an app for a client and want them to manage the content themselves. Deliver the panel white-labelled and bill it as agency work." },
            { title: "Mobile app studios", text: "The app is done, but there is no back office behind it. Buy the panel as an outside service instead of pulling a team off product work." },
            { title: "SaaS and tech companies", text: "Internal tools for your support team: find a user, fix a subscription, inspect a record — without slowing down your main product." },
            { title: "E-commerce and operations", text: "Light screens for orders, stock and campaigns. See what is in your database, arranged the way you want it." },
        ],
    },

    // PROCESS:
    process: {
        eyebrow: "HOW IT WORKS",
        title: "Four steps",
        lead: "",
        items: [
            { step: "01", title: "Discovery call", text: "Thirty minutes. We work out what data is managed, by whom, and on which screen.", time: "Day 1" },
            { step: "02", title: "Screen plan and quote", text: "Module list, screen sketches, a fixed price and a delivery date. Nothing starts before you approve it.", time: "2–3 days" },
            { step: "03", title: "Development", text: "A working build every week, running on your server against your own data.", time: "2–4 weeks" },
            { step: "04", title: "Handover and support", text: "Source code, setup documentation and training, plus a month of free fixes.", time: "Delivery" },
        ],
    },

    // DEMO:
    demo: {
        eyebrow: "LIVE DEMO",
        title: "Take a look for yourself",
        lead: "Below is a running copy of the real panel. The credentials are pre-filled, so just press <b>Login</b>. Browse the modules in the left menu and edit a record in the table.",
        frameTitle: "The real panel opens inside this frame",
        startButton: "Start the Demo",
        newTabButton: "Open in a New Tab",
        loadingText: "Loading the panel...",
        mobileWarning: "The panel is designed for desktop screens. We recommend opening the demo on a computer.",
    },

    // PRICING:
    pricing: {
        eyebrow: "PRICING",
        title: "Transparent, fixed price",
        lead: "We work per project, not per hour. The scope is fixed in writing along with the quote.",
        popularLabel: "Most popular",
        fromLabel: "starting at",
        items: [
            {
                name: "Open Source",
                price: "Free",
                priceNote: "Apache 2.0",
                text: "Download the skeleton and set it up yourself.",
                points: ["Full source code", "Modular skeleton", "Sample pages and components", "Community support"],
                button: "Download on GitHub",
                action: "download",
                packageIndex: 4,
                highlight: 0,
            },
            {
                name: "Starter",
                price: "$1,500",
                priceNote: "starting at",
                text: "A simple panel to run a single application.",
                points: ["1 module, up to 3 data tables", "Login screen and user management", "Basic theme adaptation", "Delivered in 2 weeks", "1 month of fixes"],
                button: "Get a Quote",
                action: "contact",
                packageIndex: 1,
                highlight: 0,
            },
            {
                name: "Professional",
                price: "$3,200",
                priceNote: "starting at",
                text: "A full panel with several modules, roles and reports.",
                points: ["Up to 5 modules", "Roles and permissions", "Dashboard and report screens", "Theme built for your brand", "Data source integration", "3 months of fixes"],
                button: "Get a Quote",
                action: "contact",
                packageIndex: 2,
                highlight: 1,
            },
            {
                name: "Enterprise",
                price: "Custom",
                priceNote: "let's talk",
                text: "Unlimited modules, custom integrations and ongoing work.",
                points: ["Unlimited modules", "Custom integrations", "White-label delivery", "Team training", "Support with an SLA"],
                button: "Book a Call",
                action: "contact",
                packageIndex: 3,
                highlight: 0,
            },
        ],
        footNote: "Prices exclude VAT and are finalised in the quote according to scope.",
    },

    // OPEN SOURCE:
    openSource: {
        eyebrow: "OPEN SOURCE",
        title: "Or set it up yourself",
        lead: "The panel skeleton is open source under Apache 2.0. Download it, read it, use it in commercial projects. We are here if you need us.",
        points: [
            "Panel skeleton: left menu, top bar, module system, login screen",
            "More than 40 ready-made interface components",
            "Sample pages, templates and a handbook",
            "Free for commercial use, attribution is enough",
        ],
        primaryButton: "View on GitHub",
        secondaryButton: "Open the Handbook",
    },

    // FAQ:
    faq: {
        eyebrow: "FREQUENTLY ASKED",
        title: "Good questions",
        items: [
            { q: "What is the panel written in?", a: "Plain JavaScript. The interface is drawn straight onto the DOM with a small, dependency-free library called basic.js. There is no framework, no build step and no package manager, which is why the panel stays small and still works years later." },
            { q: "Can I connect my own database?", a: "Yes. The panel does not care where the data comes from: Supabase, Firebase, a REST or GraphQL API, or your own SQL server. The data stays on your infrastructure and we stay out of the path." },
            { q: "Do we own the source code?", a: "Yes. The full source is transferred on delivery; change it as you like and run it wherever you want. No subscription, no license lock." },
            { q: "Does the panel work on mobile?", a: "The panel is designed for desktop screens, because managing data happens at a desk. Mobile-friendly screens can be built as well — we discuss that on the discovery call." },
            { q: "How long does delivery take?", a: "Around 2 weeks for a simple single-module panel, 3–4 weeks for a multi-module panel with reports. The date is fixed in writing in the quote." },
            { q: "Can you add a module to our existing panel?", a: "If your panel is built on this skeleton, it drops straight in. If not, we can build the module as an independent page and embed it in your current panel without touching your working code." },
            { q: "Do you deliver white-label?", a: "Yes, and agencies usually ask for it: the panel ships under your brand and we stay invisible. It is standard in the Enterprise package." },
            { q: "What can I do with the open source edition?", a: "Anything. Apache 2.0 allows commercial use, so you can ship it in client projects. Write to us if you want help with setup or customisation." },
        ],
    },

    // CONTACT:
    contact: {
        eyebrow: "CONTACT",
        title: "Tell us about your project",
        lead: "A few lines is enough. We usually reply the same day, and at the latest the next working day.",
        nameTitle: "FULL NAME",
        namePlaceholder: "Jack Brown",
        companyTitle: "COMPANY",
        companyPlaceholder: "Company name",
        emailTitle: "EMAIL",
        emailPlaceholder: "you@company.com",
        emailWarning: "Please enter a valid email address",
        packageTitle: "PACKAGE YOU HAVE IN MIND",
        packageList: ["Not sure yet", "Starter", "Professional", "Enterprise", "Open source / support"],
        messageTitle: "YOUR PROJECT",
        messagePlaceholder: "What kind of panel do you need? What data will you manage?",
        messageWarning: "Please write a few sentences",
        requiredText: "Required",
        sendButton: "Send",
        sendingText: "Sending...",
        successTitle: "Message received",
        successText: "Thank you. We will get back to you shortly.",
        errorTitle: "Could not send",
        errorText: "Something went wrong. You can write to us directly:",
        mailtoText: "The form service is not configured yet, so your message is opening in your email client.",
        missingText: "Please fill in the required fields.",
        orText: "or write to us directly",
        closeButton: "OK",
    },

    // FOOTER:
    footer: {
        tagline: "Lightweight, custom admin panels and dashboards.",
        columns: [
            { title: "Services", links: [ { text: "Admin panels", action: "services" }, { text: "Reports & dashboards", action: "services" }, { text: "Module development", action: "services" }, { text: "Pricing", action: "pricing" } ] },
            { title: "Product", links: [ { text: "Live demo", action: "demo" }, { text: "Features", action: "features" }, { text: "Open source", action: "openSource" }, { text: "FAQ", action: "faq" } ] },
        ],
        contactTitle: "Contact",
        rights: "All rights reserved.",
        builtWith: "This site, like the panel itself, is written in plain JavaScript with <b>basic.js</b>.",
    },

};
