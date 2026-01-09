# Unified Color Guide & UI Standards

This document outlines the unified color system and technical specifications for the application's user interface.

## 1. Technical Color Specifications

### Text Tonalities
All text must meet WCAG AA (4.5:1) or AAA (7:1) contrast ratios.

| Tonality | CSS Variable | Description | Contrast Requirement |
| :--- | :--- | :--- | :--- |
| **Primary** | `--color-text-primary` | Main content text | AA/AAA Compliance |
| **Secondary** | `--color-text-secondary` | Descriptive or less important text | 30% less opacity than primary |
| **Tertiary** | `--color-text-tertiary` | Hints, timestamps, decorative text | 50% opacity |
| **Emphasis** | `--color-text-emphasis` | Titles, bold text, critical info | ≥ 4.5:1 Contrast |
| **Disabled** | `--color-text-disabled` | Text in disabled states | 50% opacity |

### Semantic CSS Variables
Variables follow the structure: `--color-[function]-[state]`.

- **Buttons**:
  - `--color-btn-primary-bg`: Main background for primary buttons.
  - `--color-btn-primary-hover`: Hover state background.
  - `--color-btn-primary-active`: Active/click state background.
- **Alerts**:
  - `--color-alert-[variant]-bg`: Background for alert container.
  - `--color-alert-[variant]-border`: Border color for alert.
  - `--color-alert-[variant]-text`: Icon and title color.

## 2. Component Implementation

### Interactive Components
- **Buttons**:
  - Support `normal`, `hover`, `active`, and `disabled` states.
  - Primary, Secondary (Outline), Error, Success, and Warning variants.
- **Input Fields**:
  - Border: `1px solid --color-border-medium`.
  - Background: `--color-bg-main`.
  - Text Contrast: ≥ 7:1 for accessibility.
  - Focus state: `4px` ring with `--color-brand-normal` at 12% opacity.

### Alert System
A 4-color system with icons for immediate visual feedback:
- **Success (Green)**: Confirmations and positive results.
- **Error (Red)**: Failures and critical issues.
- **Warning (Orange)**: Cautions and potential risks.
- **Info (Blue)**: General information and announcements.

## 3. Standardization Process

### Audit & Matrix
An initial audit was performed on 3+ window samples identifying inconsistencies in:
- Hardcoded blue shades with transparency.
- Varied text contrast in secondary elements.
- Inconsistent border weights in form fields.

### Unification Rules
- **Colors**: Modified to use semantic variables (±5% HSL for harmony).
- **Opacity**: 100% opacity for primary elements; specific alpha values only for backgrounds or secondary elements.
- **Spacing**: Standardized padding and margins (±2px deviation allowed).

## 4. Quality Checks
- [x] 100% visual coherence across audited windows.
- [x] AA minimum text contrast (verified via manual check).
- [x] Self-contained semantic variable system.
- [x] Documented examples in `src/styles/components.scss`.

---
*Generated on 2026-01-09*
