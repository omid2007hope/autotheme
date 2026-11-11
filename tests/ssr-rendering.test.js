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

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { auto } from '../src/core/engine.js';
import { autoVars } from '../src/adapters/css-vars.js';
import { observe } from '../src/core/observer.js';

describe('SSR Rendering (Node.js Environment)', () => {
  const mockRules = [
    { time: 0, style: 'night-style', vars: { '--theme': 'dark' } },
    { time: 12, style: 'day-style', vars: { '--theme': 'light' } },
  ];

  it('should evaluate auto() based on time and not return fallback immediately', () => {
    // In Node.js (SSR), auto() should evaluate the time, not return fallback immediately
    const fallback = 'fallback-style';
    const result = auto(mockRules, fallback);
    
    // It should be either 'night-style' or 'day-style' depending on the current time of test execution
    // but definitely NOT 'fallback-style'.
    assert.notEqual(result, fallback, 'auto() returned fallback instead of evaluating rules on SSR');
    assert.ok(['night-style', 'day-style'].includes(result), 'auto() should return a valid matched style');
  });

  it('should execute autoVars() correctly when a mock target is provided on SSR', () => {
    // We create a mock DOM element
    const mockStyle = {};
    const mockElement = {
      style: {
        setProperty: (key, val) => { mockStyle[key] = val; },
        removeProperty: (key) => { delete mockStyle[key]; },
      }
    };

    const controller = autoVars(mockRules, mockElement);
    
    // Check that properties were set
    assert.ok(Object.keys(mockStyle).length > 0, 'autoVars() did not set any CSS variables on the mock target');
    assert.ok(mockStyle['--theme'] === 'dark' || mockStyle['--theme'] === 'light');
    
    // Cleanup
    if (controller && controller.stop) controller.stop();
  });

  it('should execute observe() without throwing when a mock target is provided on SSR', () => {
    let classesApplied = [];
    const mockElement = {
      classList: {
        add: (...classes) => { classesApplied.push(...classes); },
        remove: () => {},
      }
    };

    const controller = observe({
      target: mockElement,
      rules: mockRules,
      fallback: 'fallback-style',
    });

    assert.ok(classesApplied.length > 0, 'observe() did not apply classes to the mock target on SSR');
    assert.ok(classesApplied.includes('night-style') || classesApplied.includes('day-style'));
    
    if (controller && controller.stop) controller.stop();
  });
});
