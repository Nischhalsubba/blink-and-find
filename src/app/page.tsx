export default function HomePage() {
  return (
    <main className="app-shell">
      <div className="game-layout">
        <section className="game-panel p-4 text-center">
          <h1 className="compact-title mb-2">Blink &amp; Find</h1>
          <p className="text-muted-game compact-small mb-0">
            Flash it. Find it. Beat the clock.
          </p>
        </section>

        <section className="game-panel p-3 text-center">
          <div className="target-number">47</div>
          <div className="compact-small text-muted-game">
            Demo target number. Dynamic gameplay comes next.
          </div>
        </section>

        <section className="game-panel board-wrap p-2">
          <div
            className="number-grid"
            style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
          >
            {Array.from({ length: 100 }, (_, index) => index + 1).map(
              (number) => (
                <button
                  key={number}
                  className="btn btn-outline-light number-tile"
                >
                  {number}
                </button>
              )
            )}
          </div>
        </section>

        <section className="game-panel p-3 d-flex justify-content-center gap-2 flex-wrap">
          <button className="btn btn-primary">
            Single Player
          </button>

          <button className="btn btn-success">
            Multiplayer
          </button>
        </section>
      </div>
    </main>
  );
}
