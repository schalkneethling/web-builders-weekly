import stylelintOrder from "stylelint-order";
import stylelintPluginLogicalCss from "stylelint-plugin-logical-css";
import stylelintPluginUseBaseline from "stylelint-plugin-use-baseline";

/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard", "stylelint-plugin-logical-css/configs/recommended"],
  ignoreFiles: ["coverage/**", "dist/**", "dist-web/**", "node_modules/**"],
  plugins: [stylelintPluginUseBaseline, stylelintOrder, stylelintPluginLogicalCss],
  rules: {
    "alpha-value-notation": "number",
    "import-notation": "string",
    "logical-css/require-logical-keywords": [true, { fix: true }],
    "logical-css/require-logical-properties": [true, { fix: true }],
    "logical-css/require-logical-units": [true, { fix: true }],
    "order/custom-properties-alphabetical-order": true,
    "order/properties-alphabetical-order": true,
    "plugin/use-baseline": [
      true,
      {
        available: "newly",
        ignoreFunctions: ["light-dark"],
        ignoreProperties: {
          "overscroll-behavior": ["contain"],
          "text-size-adjust": [],
        },
        ignoreSelectors: ["popover-open"],
        severity: "warning",
      },
    ],
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z][a-z0-9]*(?:-[a-z0-9]+)*)?(?:--[a-z][a-z0-9]*(?:-[a-z0-9]+)*)?$",
      {
        message: "Expected class selector to follow project BEM naming",
      },
    ],
  },
};
