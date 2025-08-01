const UI = {

  COLOR_PAGE: "var(--color-page)",

  // Your color palette:
  COLOR_A: "var(--color-a)",
  COLOR_B: "var(--color-b)",
  COLOR_C: "var(--color-c)",
  COLOR_D: "var(--color-d)",
  COLOR_E: "var(--color-e)",
  COLOR_F: "var(--color-f)",

  COLOR_FIRST: "var(--color-first)",
  COLOR_SECOND: "var(--color-second)",

  BLACK: "var(--color-black)",
  DARK: "var(--color-dark)",

  GRAY_100: "var(--color-gray-100)",
  GRAY_200: "var(--color-gray-200)",
  GRAY_300: "var(--color-gray-300)",
  GRAY_500: "var(--color-gray-500)",
  GRAY_700: "var(--color-gray-700)",
  GRAY_900: "var(--color-gray-900)",

  LIGHT: "var(--color-light)",
  WHITE: "var(--color-white)",

  COLOR_BUTTON_TEXT: "var(--color-button-text)",

  TEXT_XXL: 32,
  TEXT_XL: 26,
  TEXT_L: 20,
  TEXT_M: 16,
  TEXT_S: 12,

  ROUND_A: 2,
  ROUND_B: 4,
  ROUND_C: 8,
  ROUND_D: 13,
  ROUND_E: 100,

  PADDING_X: 12,
  PADDING_Y: 4,

  MARGIN_X: 20,
  MARGIN_Y: 20,

  SPACING_S: 8,
  SPACING_M: 16,
  SPACING_L: 32,

  TRANSITION: "0.2s ease",

  BREAKPOINTS: {
    SM: 480,
    MD: 768,
    LG: 1024,
    XL: 1280,
  }

};

// White(0.2), White(0), White(1), Black(0.2)

UI.createMotion = function(names = []) {
  let motionString = "";
  names.forEach(name => {
    motionString = motionString + ((!motionString) ? "" : ", ") + name + UI.TRANSITION;
  });
};

UI.applyTheme = function(isDark) {

  if (isDark) {
    page.bodyElement.classList.add('dark');
  } else {
    page.bodyElement.classList.remove('dark');
  }

};

UI.styleLabel = function(lbl) {
  lbl.fontSize = UI.TEXT_L;
  lbl.textColor = UI.DARK;
  lbl.color = UI.LIGHT;
  lbl.padding = [UI.PADDING_X, UI.PADDING_Y];
};

UI.styleBlackLabel = function(lbl) {
  lbl.fontSize = UI.TEXT_L;
  lbl.textColor = UI.LIGHT;
  lbl.color = UI.DARK;
  lbl.padding = [UI.PADDING_X, UI.PADDING_Y];
};

UI.styleButton = function(btn) {
  btn.fontSize = UI.TEXT_L;
  btn.textColor = UI.COLOR_BUTTON_TEXT;
  btn.color = UI.COLOR_FIRST;
};

UI.styleSecondButton = function(btn) {
  btn.fontSize = UI.TEXT_L;
  btn.textColor = UI.COLOR_BUTTON_TEXT;
  btn.color = UI.COLOR_SECOND;
  btn.minimal = 1;
};

UI.effectButton = function(btn) {

  btn.setMotion("filter 0.2s, transform 0.2s");

  btn.on("mouseover", function() {
      btn.elem.style.filter = "brightness(120%)";
  });

  btn.on("mouseout", function() {
      btn.elem.style.filter = "brightness(100%)";
  });

  btn.on("mousedown", function() {
      btn.elem.style.transform = "scale(0.95)";
      btn.elem.style.filter = "brightness(80%)";
      
      setTimeout(function(){
          btn.elem.style.transform = "scale(1)";
          btn.elem.style.filter = "brightness(120%)";
      }, 200);
  });

};

