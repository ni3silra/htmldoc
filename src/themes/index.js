/**
 * Theme module exports for HTML Diagram Library
 */

import { ThemeManager } from './ThemeManager.js';
import { DefaultTheme } from './DefaultTheme.js';
import { validateTheme, mergeThemes } from './ThemeValidator.js';

export { ThemeManager, DefaultTheme, validateTheme, mergeThemes };

export default {
    ThemeManager,
    DefaultTheme,
    validateTheme,
    mergeThemes
};