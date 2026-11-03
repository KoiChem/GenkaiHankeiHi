# FCC View Controls Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans with the approved conversation requirements.

**Goal:** Default to NaCl, make stereo and projection controls direct, simplify the section cube and improve ion and grid controls.

**Architecture:** Update the existing FCC page and shared view cube, preserving the existing scenes, camera target, stereo comparison return and object state. Keep legacy `index.html` untouched.

**Tech Stack:** HTML/CSS, JavaScript, Three.js r128, Playwright, Node.

**Spec:** The user's six points and the approved preceding response define all visible behavior.

## Tasks

1. Write browser regression checks for initial NaCl, explicit projection choices in both stereo methods, comparison return, section cube, 60% drag speed, ion thumbs and responsive grid icons; run them against the current code.
2. Update page initialization, stereo transitions and compact controls; remove the section-front button and its exclusive camera-animation code.
3. Remove cube labels, resize the existing cube by 1.2 and change drag speed to 60% of the original while preserving face selection and screen-relative axes.
4. Update affected existing tests, run relevant browser and geometry checks, review the diff, publish and check the live site.
