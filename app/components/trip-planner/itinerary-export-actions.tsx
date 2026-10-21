"use client";

import { useState } from "react";
import styles from "./trip-planner.module.css";

export default function ItineraryExportActions({
  markdown,
  filename,
  mountainName,
}: {
  markdown: string;
  filename: string;
  mountainName: string;
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

  async function emailItinerary() {
    setMessage("");
    const file = createMarkdownFile(markdown, filename);

    if (
      typeof navigator.share === "function" &&
      navigator.canShare?.({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: `${mountainName} adventure itinerary`,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    const opened = openEmailDraft(markdown, mountainName);
    if (!opened) {
      setMessage(
        "This itinerary is too long for an email draft. Download the Markdown file and attach it to your email.",
      );
    }
  }

  return (
    <div className={styles.exportActions}>
      <button type="button" onClick={downloadMarkdown}>
        Download itinerary (.md)
      </button>
      <button type="button" onClick={emailItinerary}>
        Email itinerary
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

function openEmailDraft(markdown: string, mountainName: string) {
  const subject = `${mountainName} adventure itinerary`;
  const body = `Hi,\n\nHere is my ${mountainName} adventure itinerary.\n\n${markdown}`;
  const draftUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  if (draftUrl.length > 6000) {
    return false;
  }

  window.location.href = draftUrl;
  return true;
}
