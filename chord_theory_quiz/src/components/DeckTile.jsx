import { Link } from "react-router-dom";

/** A deck as a square record sleeve: category, title, mastery meter. */
export default function DeckTile({ deck, stats, linked = true }) {
  const pct = Math.round((stats?.mastery ?? 0) * 100);
  const body = (
    <>
      <span className="tile-art" aria-hidden="true">
        {deck.art}
      </span>
      <span className="tile-cat">{deck.category}</span>
      <span>
        <span className="tile-title">{deck.title}</span>
        {stats && (
          <span className="tile-meter">
            <span className="tile-meter-bar">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="tile-meter-text num">
              <span>{pct}% mastered</span>
              {stats.due > 0 && <span>{stats.due} due</span>}
            </span>
          </span>
        )}
      </span>
    </>
  );
  const className = `tile c-${deck.color}`;
  return linked ? (
    <Link to={`/deck/${deck.id}`} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
