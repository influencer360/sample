"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagHeaderContainer = exports.HeaderRightContainer = void 0;
const fe_lib_theme_1 = require("fe-lib-theme");
const styled_components_1 = __importDefault(require("styled-components"));
const HeaderRightContainer = (0, fe_lib_theme_1.withHsTheme)(styled_components_1.default.div `
  position: fixed;
  display: flex;
  right: ${() => (0, fe_lib_theme_1.getThemeValue)(t => t.spacing.spacing16)};
  align-items: center;
  min-width: 550px;
  justify-content: end;

  .bulk-selected {
    background-color: ${() => (0, fe_lib_theme_1.getThemeValue)(t => t.colors.secondary20)};
    border: solid 1px ${() => (0, fe_lib_theme_1.getThemeValue)(t => t.colors.secondary80)};

    .header-left .primary-btn {
      border-color: ${() => (0, fe_lib_theme_1.getThemeValue)(t => t.colors.secondary80)};
    }
  }

  .create-tag {
    margin-left: ${() => (0, fe_lib_theme_1.getThemeValue)(t => t.spacing.spacing8)};
  }
`);
exports.HeaderRightContainer = HeaderRightContainer;
const TagHeaderContainer = styled_components_1.default.div `
  display: flex;
  align-items: center;
  margin-bottom: ${() => (0, fe_lib_theme_1.getThemeValue)(t => t.spacing.spacing4)};
  position: fixed;
  width: 100%;
  z-index: 100;
`;
exports.TagHeaderContainer = TagHeaderContainer;
