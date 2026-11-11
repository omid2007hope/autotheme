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

const fs = require('fs');
let content = fs.readFileSync('tests/bugfix.test.js', 'utf8');

// The test name has a weird character in it so we match up to "before the hour"
const regex = /it\("composite rule with a single time, inside range before the hour[^"]+", \(\) => \{[\s\S]*?\}\);/g;

const replacement = `it("composite rule with a single time, inside range before the hour — falls through (T05 wrap-around fix)", () => {
    const rules = [
      {
        since: "12-01",
        until: "02-28",
        time: 18,
        style: "dark-winter-evening",
      },
    ];
    // Dec 15 at 14:00 inside range, but before 18:00. Should NOT wrap around.
    const inRangeBefore = new Date(2027, 11, 15, 14, 0, 0);
    assert.strictEqual(
      auto(rules, "fallback", inRangeBefore),
      "fallback",
    );
  });`;

content = content.replace(regex, replacement);
fs.writeFileSync('tests/bugfix.test.js', content);
console.log("Replacement complete");
