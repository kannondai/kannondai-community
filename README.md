
# Kannondai Community Information Site

> **For AI assistants (GitHub Copilot)**: Context is loaded automatically from `.github/copilot-instructions.md`.

This repository hosts the website and resources for the Kannondai Community (Tsukuba City, Japan). The site is an independent, volunteer-driven project and is not affiliated with the city government or any official neighborhood association.

## Overview

The website provides information and resources for residents of the Kannondai area, including:
- Community news and updates
- Hall reservation status and usage
- Local park and facility information
- Community philosophy and governance discussions
- Environmental initiatives and proposals

## Technical Overview

### Hall Reservation Calendar System

**Data Flow** (as of 2026-08-12):
```
[C-SQR (CircleSquare)] 
  ↓ Daily at 9:00 JST (GitHub Actions)
[calendar-reservations.json] ← Initial display (fast, 0.1-0.5s)
  ↓ Auto-sync
[GAS Sheets] ← User CRUD via GAS API (immediate)
```

**Key Design**:
- **Initial load**: Static JSON (avoids GAS cold start delay)
- **After user CRUD**: GAS API fetch (ensures latest data)
- **Auto-sync**: Daily at 9:00 JST from C-SQR to both JSON and GAS

See [`docs/scripts/SYSTEM_OVERVIEW.md`](docs/scripts/SYSTEM_OVERVIEW.md) for details.

## Philosophy

We believe that even small organizations, such as a neighborhood association, benefit from thoughtful rules and open discussion. Our site explores topics such as:
- The pros and cons of rotating mandatory officer systems vs. volunteer-based roles
- The importance of accumulating operational know-how and sharing responsibilities
- The need for a balance between fairness, diversity, and sustainability in community management

For more, see [About This Site](https://freesemt.github.io/kannondai-community/about_this_site.html).

## How to Use

Visit the site: [https://freesemt.github.io/kannondai-community/](https://freesemt.github.io/kannondai-community/)

For local development or contributions, see the README files in the `web` and `software` directories.

## License

The content of this repository is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) license.
See the LICENSE file for details.