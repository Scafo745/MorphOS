# Development & Steering Guidelines: MorphOS

You are working inside **MorphOS** — a browser-based, prompt-adaptive Operating System that reshapes itself around what the user asks for.

## Core Rules:
1. **Microkernel Integrity**:
   - System state is centralized in `src/core/store.ts` using Zustand.
   - VFS file operations must validate against `evaluateFileSecurity` and `checkDestructiveSignature` in `src/kernel/security.ts`.
   - Never disable the LSM Accidental Data Loss Guard: it is a core safety requirement.

2. **Window Management & Layering**:
   - Any new window/app MUST be registered in `src/core/types.ts` under `AppId`.
   - Window stacking relies on both `zIndex: win.zIndex` and child DOM order via `focusWindow`. Always maintain `onPointerDownCapture` on window containers.

3. **Dynamic Design Token Engine**:
   - Every UI element (Desktop wallpaper, ambient orbs, dock icons, window chrome, text) is dynamically bound to `profile.customTokens` in `src/core/types.ts`.
   - Icon styling is handled by `getIconTheme` in `src/core/icon-theme.ts`. If adding new apps, provide their styles in `getIconTheme`.

4. **Payments & FinTech Context**:
   - The primary FinTech app is `src/apps/Payments.tsx`. Any new financial feature must preserve PCI-DSS 4.0 Level 1 tokenization and multi-bank routing rails (HDFC, ICICI, SBI, Axis).
