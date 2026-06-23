# Principles table: working well with AI

The decision map behind the post. Three kinds of question: about the work, about the method,
about the tool's failure modes. Examples are stand-ins, swap for real ones.

## Group 1 — What kind of work is this? *(decide before you start; sets the stakes)*

Triage. Answered by looking at the task, not the tool. The axes overlap but can come apart.

| Principle | One side | Other side | The question it asks |
|---|---|---|---|
| **Standard of care** | Just needs done | Needs done well | How good does this have to be? |
| **Human or tool** | Glad it just exists | Want a human in it | Does the value come from the artifact, or from my judgment being in it? |
| **Audience & durability** | Just for me, ephemeral | Shared, enters others' workflow | Who depends on this, and does it outlive the moment? |

Note: "audience & durability" overlaps with "standard of care" but isn't reducible to it. The
divergent cases: a private note done carefully (private + high care); a rough answer to a colleague
(shared + low care). Sharing also creates a contract you don't fully control, and forces clarity
that private thinking lets you skip.

## Group 2 — How should I drive the tool? *(operating technique)*

How you run the model once you know what the work is. Two sub-families.

### 2a. The determinism family (output, or a repeatable machine?)

| Principle | One side | Other side | The question it asks |
|---|---|---|---|
| **Determinism** | Variation is fine | I want a fixed result | Would it bother me if two runs differed? |
| **Abstraction level** | Make the thing | Make the tool that makes the thing | If I want determinism, move up a level. |
| **Repetition** | Prompt each time | Automate once | Am I about to ask for the same shape a 5th time? |

Anchor line: the model is a mediocre factory and a good factory builder.

### 2b. The iteration family (how do I converge?)

| Principle | One side | Other side | The question it asks |
|---|---|---|---|
| **Context strategy** | Enrich (keep going) | Reset (start clean) | Am I converging, or spiraling? |
| **Convergence** | One-shot it | Loop toward the optimum | Does the target deserve multiple passes? |

## Group 3 — What won't the tool do for me? *(standing vigilance)*

Not decisions, tendencies. The "overconfident intern" frame lives here.

| Principle | The trap | The counter-move | What it costs if ignored |
|---|---|---|---|
| **Consequences** | Agent bears nothing | Close the loop (tests, CI, "now you fix it") | "Done" that isn't done |
| **Defaults (monkey see, monkey do)** | It copies whatever it's shown | Set the standard yourself | Mess that grows mess |
| **Effort & learning** | It hands you the feeling of expertise | Extract and metabolize on purpose (the FP course) | The illusion of explanatory depth |

## The spine in one line
Group 1 is judgment about the work, Group 2 is judgment about the method, Group 3 is judgment
about the tool's failure modes.
