# CyberQuest

An interactive cybersecurity education platform for students aged 14–18. Teaches vulnerability concepts through a mix of lectures and hands-on challenges, targeting Tier A CTF readiness with a progression path to Tier B.

## Language

**Module**:
A self-contained learning unit built around one vulnerability class (e.g. XSS, SQL Injection, CSRF). Contains a learn page, one or more bridge lectures, and a sequence of challenges of increasing difficulty.
_Avoid_: topic, section, course, level

**Challenge**:
A hands-on, browser-based exercise where a student exploits a deliberately vulnerable fictional web app (e.g. ByteBoard, AdminPortal). The primary unit of active learning. Each challenge has a difficulty rating, point value, tiered hints, and an animated solution walkthrough.
_Avoid_: exercise, lab, task, puzzle

**Learn Page**:
The introductory lecture for a module — an interactive page covering the concept, attack flow, payload anatomy, danger cards, and defensive comparisons. Unlocks before the first challenge in a module.
_Avoid_: lecture page, intro page, tutorial

**Bridge Lecture**:
A short interactive lesson that unlocks between two challenges to introduce the next concept (e.g. schema discovery before a UNION-based challenge). Distinct from a Learn Page — it is mid-sequence and concept-specific, not a module introduction.
_Avoid_: interstitial, mid-lecture, mini-lecture

**Module Intro**:
A reusable component rendered at the top of a module's Learn Page that covers foundational knowledge the student needs before any challenge in that module (e.g. HTTP sessions and cookies before CSRF). Distinct from a Bridge Lecture, which sits between two specific challenges. Does not require its own curriculum entry or route — it is part of the learn page.
_Avoid_: prerequisite page, intro module, foundations section

**Sandbox**:
The isolated environment in which a challenge's vulnerable app runs. Two types exist: `srcdoc` (stateless, runs entirely in the browser) and `container` (Docker-based, for challenges requiring server-side state or real HTTP). See ADR-0001.
_Avoid_: environment, VM, instance

**Tier A**:
Beginner CTF difficulty, targeting competitions such as PicoCTF and school/poly-level events. The platform's current content targets this level. Challenges at this tier test textbook vulnerability classes with minimal or no filter evasion.
_Avoid_: beginner level, easy mode

**Tier B**:
Intermediate CTF difficulty, targeting competitions such as CTFtime.org events and CDDC. The platform's long-term progression target. Requires content beyond textbook patterns: filter bypass, blind injection, DOM-based attacks, command injection.
_Avoid_: advanced level, hard mode
