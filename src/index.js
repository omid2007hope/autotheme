// SPDX-License-Identifier: LicenseRef-AutoTheme-Proprietary
/*
 * Copyright (c) 2026 Omid Teimory. All Rights Reserved.
 *
 * PROPRIETARY SOURCE-AVAILABLE SOFTWARE — NOT OPEN SOURCE.
 * Permission to view, clone, or compile this file is granted strictly on the
 * condition precedent of full compliance with the root ./LICENSE file.
 * Copying snippets, modifying, creating derivative works, redistributing,
 * commercial/SaaS use, and AI/ML training (reserved under EU Directive
 * 2019/790 Art. 4(3) and § 42h(6) Austrian UrhG) are strictly prohibited.
 * Removal or alteration of this notice violates 17 U.S.C. § 1202 and § 90c UrhG.
 */

/**
 * AutoTheme — Self-driving CSS.
 * Zero-dependency time, date, and seasonal UI theming.
 *
 * @module autotheme
 */

export { auto, compile } from './core/engine.js';
export { autoVars } from './adapters/css-vars.js';
export { observe } from './core/observer.js';
