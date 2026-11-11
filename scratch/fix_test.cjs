/*
 * Copyright (c) 2026 Omid Teimory. All Rights Reserved.
 *
 * NOTICE: This file contains proprietary source code licensed exclusively under the
 * terms of the LICENSE file in the root directory of this repository.
 * You may view, download, and compile this code solely to run the unmodified product.
 * Copying, pasting, modifying, redistributing, creating derivative works, or using
 * this code in any other project or AI training system is strictly prohibited.
 * Removal or alteration of this notice is a violation of 17 U.S.C. § 1202 and EU law.
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
