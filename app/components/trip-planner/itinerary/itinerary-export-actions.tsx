"use client";

import { useState } from "react";
import styles from "../trip-planner.module.css";

export default function ItineraryExportActions({
  markdown,
  filename,
}: {
  markdown: string;
  filename: string;
}) {
  const [message, setMessage] = useState("");

  function downloadMarkdown() {
    const file = createMarkdownFile(markdown, filename);
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Markdown itinerary downloaded.");
  }

  return (
    <div className={styles.exportActions}>
      <button type="button" onClick={downloadMarkdown}>
        Download itinerary (.md)
      </button>
      <p className={styles.exportStatus} role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

function createMarkdownFile(markdown: string, filename: string) {
  return new File([markdown], filename, {
    type: "text/markdown;charset=utf-8",
  });
}
