import type { Puzzle } from "../../types/puzzle";
import { ThemeSwitch } from "../ThemeSwitch/ThemeSwitch";

interface PuzzleHeaderProps {
  puzzle: Puzzle;
}

const puzzleDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function PuzzleHeader({ puzzle }: PuzzleHeaderProps) {
  const date = puzzleDateFormatter.format(new Date(`${puzzle.date}T00:00:00Z`));

  return (
    <header className="puzzle-header">
      <div className="puzzle-header__identity">
        <hgroup className="puzzle-header__heading">
          <p className="puzzle-header__kicker">Web Builders Weekly</p>
          <h1 className="puzzle-header__title">Crossword</h1>
        </hgroup>
        <p className="puzzle-header__meta">
          <span>{puzzle.theme}</span>
          <span>{date}</span>
          <span>
            {puzzle.size.rows} by {puzzle.size.cols}
          </span>
        </p>
      </div>
      <div className="puzzle-header__bar">
        <ThemeSwitch />
      </div>
    </header>
  );
}
