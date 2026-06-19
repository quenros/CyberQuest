# Module prerequisite content lives in a reusable ModuleIntro component

When a module requires foundational knowledge before the first challenge (e.g. HTTP
sessions and cookies before CSRF), that content is folded into the module's learn page
as a dedicated ModuleIntro component — not as a separate prerequisite page in the
curriculum, and not as ad-hoc sections duplicated per module.

The ModuleIntro component handles the "before we attack, you need to understand X"
pattern and is reusable across future modules that have the same need (e.g. a network
basics primer before a packet-analysis module).

Chosen over a separate prerequisite page in the curriculum (Option A) because it
requires no changes to topics.js, curriculum.js, or App.jsx routing. The content
flows naturally into the rest of the learn page: foundation → concept → attack → challenge.

When to use ModuleIntro vs a Bridge Lecture:
- ModuleIntro: foundational knowledge the student needs before any challenge in the
  module (sits at the top of the learn page, before the attack concept is introduced)
- Bridge Lecture: concept needed between two specific challenges within a module
  (sits in the curriculum sidebar between challenge N and challenge N+1)
