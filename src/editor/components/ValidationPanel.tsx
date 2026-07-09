import type { CompileResult } from "../../authoring/types";

interface ValidationPanelProps {
  compileResult: CompileResult;
}

export function ValidationPanel({ compileResult }: ValidationPanelProps) {
  const hasIssues = compileResult.errors.length > 0 || compileResult.warnings.length > 0;

  return (
    <section aria-labelledby="editor-validation-title" className="editor-validation">
      <h2 id="editor-validation-title">Validation</h2>

      {!hasIssues ? (
        <p className="editor-validation__ok" role="status">
          Puzzle compiles cleanly and is ready to export.
        </p>
      ) : null}

      {compileResult.errors.length > 0 ? (
        <div className="editor-validation__group">
          <h3>Errors</h3>
          <ul className="editor-validation__list editor-validation__list--errors">
            {compileResult.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {compileResult.warnings.length > 0 ? (
        <div className="editor-validation__group">
          <h3>Warnings</h3>
          <ul className="editor-validation__list editor-validation__list--warnings">
            {compileResult.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
