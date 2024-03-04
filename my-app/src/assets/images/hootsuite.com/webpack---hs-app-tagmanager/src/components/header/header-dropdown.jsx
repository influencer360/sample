"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const prop_types_1 = __importDefault(require("prop-types"));
const styled_components_1 = __importDefault(require("styled-components"));
const fe_lib_theme_1 = require("fe-lib-theme");
const fe_adp_comp_select_1 = __importDefault(require("fe-adp-comp-select"));
const StyledSelect = (0, fe_lib_theme_1.withHsTheme)((0, styled_components_1.default)(fe_adp_comp_select_1.default) `
  margin-left: ${() => (0, fe_lib_theme_1.getThemeValue)(t => t.spacing.spacing8)};
  min-width: 150px;
`);
const HeaderDropdown = ({ label, options, handleSelect }) => (react_1.default.createElement(StyledSelect, { labelId: label, onChange: handleSelect, options: options, value: label }));
HeaderDropdown.propTypes = {
    label: prop_types_1.default.string.isRequired,
    handleSelect: prop_types_1.default.func.isRequired,
    options: prop_types_1.default.arrayOf(prop_types_1.default.shape({
        label: prop_types_1.default.string.isRequired,
        value: prop_types_1.default.string,
    })).isRequired
};
exports.default = HeaderDropdown;
