# ♗ alu-chess-web

Web-Frontend für das **alu-chess** Schachprojekt — entwickelt im Rahmen des Moduls *Softwarearchitektur* (AIN, Semester 7).

Das UI ist von [Lichess](https://lichess.org) inspiriert und kommuniziert über REST-APIs mit einem Java-Backend (Controller + Model).

## Features

- **Schachbrett** mit Drag-and-Drop & Klick-Steuerung (react-chessboard v5)
- **Spieler-Leisten** über/unter dem Brett mit Uhr und geschlagenen Figuren
- **Zugliste** mit Navigation (vor/zurück/Anfang/Ende) und Step-by-Step-Replay
- **Schach/Schachmatt-Overlay** mit Pop-Animation
- **Werkzeuge-Drawer**: FEN/PGN Import/Export, Testpositionen, JSON Import/Export
- **Spielverlauf**: Gespeicherte Partien laden und als Replay ansehen
- **Startseite** mit Zeitformat-Auswahl und Vorschau auf kommende Features
- **Adaptive Replay-Geschwindigkeit** — passt sich der Zuganzahl an
- **Dark Theme** mit Lichess-Farbschema

## Tech-Stack

| Technologie | Verwendung |
|---|---|
| [React 19](https://react.dev) + TypeScript | UI-Framework |
| [Vite 8](https://vite.dev) | Build-Tool & Dev-Server |
| [react-chessboard](https://www.npmjs.com/package/react-chessboard) v5 | Schachbrett-Darstellung |
| [chess.js](https://github.com/jhlywa/chess.js) | Lokale Zugvalidierung & legale Züge |
| [Zustand](https://zustand.docs.pmnd.rs/) | State-Management |
| [React Router](https://reactrouter.com) v7 | Client-Side Routing |
| [Tailwind CSS](https://tailwindcss.com) v4 | Utility-Styles |
| [react-hot-toast](https://react-hot-toast.com) | Benachrichtigungen |

## Voraussetzungen

- **Node.js** ≥ 18
- **Backend-Services** müssen laufen:
  - Controller auf `http://localhost:8081`
  - Model auf `http://localhost:8082`

## Installation & Start

```bash
npm install
npm run dev
```

Die App startet unter `http://localhost:5173`.

## Projektstruktur

```
src/
├── api/                    # REST-Clients (Controller, Model, SSE)
├── components/
│   ├── Board/              # ChessBoard, PromotionDialog
│   ├── Controls/           # FenPgnTools, GameStatus, NewGameDialog
│   ├── GameHistory/        # SavedGames
│   ├── History/            # MoveList, NavigationBar
│   └── Layout/             # NavBar, SidePanel
├── pages/                  # HomePage, PlayPage, HistoryPage
├── store/                  # Zustand Game-Store mit SSE-Sync
└── types/                  # TypeScript-Typen (GameJson, ControllerState, …)
```

## API-Endpunkte

### Controller (`localhost:8081`)

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/controller/state` | Spielzustand abrufen |
| POST | `/api/controller/new-game` | Neues Spiel starten |
| POST | `/api/controller/move` | Zug ausführen |
| POST | `/api/controller/load-fen` | FEN-Position laden |
| POST | `/api/controller/resign` | Aufgeben |
| POST | `/api/controller/browse/*` | Zugnavigation (back/forward/to-start/to-end/to-move) |
| GET | `/api/controller/move-history` | Zughistorie |
| GET | `/api/controller/games` | Gespeicherte Spiele |
| POST | `/api/controller/replay/load` | Replay laden |
| SSE | `/api/controller/events` | Live-Updates |

### Model (`localhost:8082`)

| Methode | Endpoint | Beschreibung |
|---|---|---|
| POST | `/api/model/legal-moves` | Legale Züge für FEN |
| POST | `/api/model/parse-pgn` | PGN parsen |
| GET | `/api/model/test-positions` | Testpositionen |

## Scripts

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Dev-Server starten |
| `npm run build` | Production-Build |
| `npm run lint` | ESLint ausführen |
| `npm run preview` | Build-Vorschau |
