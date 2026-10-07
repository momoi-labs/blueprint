# Web application architecture

The default architecture for Momoi Labs product web applications: a browser
client backed by an HTTP API. It records decisions Momoi Labs has already made,
so people and coding agents do not make them again in every project. Static
sites are out of scope.

## Rules

1. **Use the defaults.** Deviate only for a concrete product need, and record
   the reason in the project's ADRs.
2. **Add complexity only for a real need.** Do not add a library, layer,
   service, or abstraction before the project needs it.
3. **Leave existing choices alone.** A project that already differs keeps its
   choice until a real need justifies changing it. Do not migrate as a side
   effect of unrelated work.
4. **Grow this pattern from practice.** Add a new default only after it has
   worked in a real project, and propose it with that evidence.

## Baseline

```text
Browser
→ React + TypeScript
→ Kiso
→ TanStack Router
→ TanStack Query
→ generated, typed API client
→ HTTP
→ Rust
→ PostgreSQL
```

## Frontend

| Concern | Default |
| --- | --- |
| Language | TypeScript |
| UI library | React |
| UI | Kiso for tokens, components, and UI patterns. Follow [`kiso/AGENTS.md`](../../kiso/AGENTS.md) |
| Routing | TanStack Router |
| Server state | TanStack Query. Fetch API data through it, not with `useEffect` or hand-written stores |
| Forms | TanStack Form when a form's state or validation justifies it. Optional |

## Backend

| Concern | Default |
| --- | --- |
| Language | Rust |
| HTTP | Axum |
| Serialization | Serde |
| Database | PostgreSQL, when the app needs one |
| Database access | SQLx |

Prefer established crates and explicit code. Avoid magic abstractions and
heavily opinionated frameworks: people and coding agents must be able to read
the code and change it.

Rust is a deliberate choice. It does not always give the simplest web backend.
We choose it to build up knowledge, tooling, and libraries in one ecosystem
that we also use outside web applications, for example for PostgreSQL tooling
and extensions. Rust-first, not Rust-only: another language needs a concrete
product reason, recorded in the project's ADRs.

## API contracts

Rust is the source of truth for API contracts.

- Define each request and response type once, in Rust.
- Generate the TypeScript types or client from that definition. Never write or
  maintain the same contract by hand in TypeScript.
- The generation tool is not standardized yet. Options include an OpenAPI
  document from utoipa or aide, or direct type export with ts-rs. Each project
  records its choice in its ADRs. A tool becomes the default only after real
  projects have used it.

## Rendering

Client-side rendering (CSR) is the default. The Rust binary embeds the built
client and serves it, so production runs no Node process.

SSR is an optional rendering and deployment strategy. Introduce it only for a
concrete product requirement, such as public pages that search engines must
index, link previews on social platforms, or initial-render needs that CSR
cannot meet. Framework support alone is not a reason.

## Not covered yet

This pattern has no rules yet for workers, queues, background jobs, event
architecture, caching, observability, deployment, authentication, PostgreSQL
extensions, or microservices. A project that needs one decides it locally and
records the decision in its ADRs. Rule 4 governs when it becomes part of this
pattern.
