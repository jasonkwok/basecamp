"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  formatMountainBudget,
  getMountainBudget,
} from "../../../data/mountain-budgets";
import { MOUNTAINS, type MountainCatalogEntry } from "../../../data/mountains";
import {
  getEmptySessionSummitSnapshot,
  getSessionSummitSnapshot,
  getSessionSummitedMountainIds,
  subscribeToSessionSummits,
} from "../../../data/session-summits";
import { DIFFICULTY_LEVELS } from "../../../data/difficulty-levels";
import { MOUNTAIN_EXPERIENCE } from "../../../lib/trip-planner/experience-levels";
import type {
  MountainExperience,
  MountainGuideMessage,
  MountainRecommendation,
} from "../../../lib/mountain-guide/schema";
import { buildMountainRecommendationsMarkdown } from "./mountain-recommendations-markdown";
import styles from "./mountain-guide-chat.module.css";

type ExperienceOption = [
  MountainExperience,
  (typeof MOUNTAIN_EXPERIENCE)[MountainExperience],
];

const EXPERIENCE_OPTIONS = Object.entries(
  MOUNTAIN_EXPERIENCE,
) as ExperienceOption[];

const MOUNTAIN_BY_ID = new Map(
  MOUNTAINS.map((mountain) => [mountain.id, mountain]),
);

export default function MountainGuideChat({
  open,
  onToggle,
  onOpenSearch,
  onSelectMountain,
  hasSelectedMountain,
}: {
  open: boolean;
  onToggle: (open: boolean) => void;
  onOpenSearch: () => void;
  onSelectMountain: (summit: MountainCatalogEntry, experience: MountainExperience) => void;
  hasSelectedMountain: boolean;
}) {
  const [experience, setExperience] = useState<MountainExperience | "">("");
  const [input, setInput] = useState("");
  const summitSnapshot = useSyncExternalStore(
    subscribeToSessionSummits,
    getSessionSummitSnapshot,
    getEmptySessionSummitSnapshot,
  );
  const summitedMountainIds = new Set(JSON.parse(summitSnapshot) as string[]);
  const conversationEnd = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const experienceRef = useRef<HTMLSelectElement>(null);

  // Read summit progress per send so a newly marked peak is never stale context.
  const transport = useMemo(
    () =>
      new DefaultChatTransport<MountainGuideMessage>({
        api: "/api/mountain-guide",
        body: () => ({
          experience,
          summitedMountainIds: getSessionSummitedMountainIds(),
        }),
      }),
    [experience],
  );

  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    clearError,
    setMessages,
  } = useChat<MountainGuideMessage>({ transport });

  const isBusy = status === "submitted" || status === "streaming";
  const hasConversation = messages.length > 0;

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!open) return;

    if (experience) inputRef.current?.focus();
    else experienceRef.current?.focus();
  }, [open, experience]);

  function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isBusy || !experience) return;

    clearError();
    sendMessage({ text });
    setInput("");
  }

  function handleRecommendationSelect(mountain: MountainCatalogEntry) {
    if (experience) onSelectMountain(mountain, experience);
  }

  function downloadRecommendations(
    recommendations: MountainRecommendation[],
  ) {
    const options = recommendations.flatMap((recommendation) => {
      const mountain = MOUNTAIN_BY_ID.get(recommendation.mountainId);
      if (!mountain || summitedMountainIds.has(recommendation.mountainId)) return [];

      const budget = getMountainBudget(mountain);
      const difficulty = DIFFICULTY_LEVELS[mountain.difficulty.level];

      return [
        {
          name: mountain.name,
          objective: recommendation.objective,
          location: `${mountain.location} · ${mountain.region}`,
          elevationMeters: mountain.elevationMeters,
          difficulty: difficulty.fullLabel,
          ascent: mountain.difficulty.ascent,
          tripLength: `${mountain.tripLength.minDays}–${mountain.tripLength.maxDays} days`,
          budget: formatMountainBudget(budget),
          budgetBasis: budget.basis,
          budgetSource: budget.sourceUrl,
          description: mountain.description,
          rating: recommendation.rating,
          reason: recommendation.reason,
        },
      ];
    });

    const markdown = buildMountainRecommendationsMarkdown({
      experience: experience ? MOUNTAIN_EXPERIENCE[experience].label : "Not selected",
      options,
    });
    const file = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `mountain-recommendations-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  }

  return (
    <div
      className={`${styles.root} ${hasSelectedMountain ? styles.withProfile : ""}`}
      data-open={open}
    >
      {!open ? (
        <button
          className={styles.trigger}
          type="button"
          aria-expanded={open}
          aria-controls="mountain-guide-panel"
          onClick={() => onToggle(!open)}
        >
          <span className={styles.triggerIcon} aria-hidden="true">
            🥾
          </span>
          <span className={styles.triggerCopy}>
            <strong>Find your next mountain</strong>
            <small>Personalized picks for your next adventure</small>
          </span>
          <span className={styles.triggerArrow} aria-hidden="true">
            →
          </span>
        </button>
      ) : null}

      {open ? (
        <section
          className={styles.panel}
          id="mountain-guide-panel"
          aria-label="Mountain recommendation chat"
        >
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>MOUNTAIN MATCH</p>
              <h2>Find your next mountain</h2>
            </div>
            <div className={styles.headerActions}>
              {hasConversation ? (
                <button
                  className={styles.newChat}
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    clearError();
                    setInput("");
                  }}
                >
                  New chat
                </button>
              ) : null}
              <button
                type="button"
                className={styles.close}
                aria-label="Close mountain guide"
                onClick={() => onToggle(false)}
              >
                ×
              </button>
            </div>
          </header>

          <div className={styles.messages} role="log" aria-live="polite">
            <div className={styles.welcome}>
              <p className={styles.assistantMessage}>
                What are you working toward—a particular mountain, building
                skills, or finding your next adventure?
              </p>
              <button
                className={styles.searchShortcut}
                type="button"
                onClick={onOpenSearch}
              >
                🏔️ Search a mountain to mark it summited
              </button>
            </div>

            {messages.map((message) => (
              <div
                className={
                  message.role === "user"
                    ? styles.userMessage
                    : styles.assistantTurn
                }
                key={message.id}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <p
                        className={
                          message.role === "user"
                            ? styles.userBubble
                            : styles.assistantMessage
                        }
                        key={`${message.id}-${index}`}
                      >
                        {part.text}
                      </p>
                    );
                  }

                  if (part.type === "data-mountain-recommendations") {
                    const visibleOptions = part.data.filter(({ mountainId }) => !summitedMountainIds.has(mountainId));
                    if (visibleOptions.length === 0) {
                      return <p className={styles.summitReminder} key={`${message.id}-${index}`}>
                        These options are now marked as summited. Ask for new matches to find your next mountain.
                      </p>;
                    }
                    return (
                      <div
                        className={styles.recommendations}
                        key={`${message.id}-${index}`}
                      >
                        {visibleOptions.map((recommendation) => (
                          <RecommendationCard
                            key={recommendation.mountainId}
                            recommendation={recommendation}
                            onSelect={handleRecommendationSelect}
                          />
                        ))}
                        {part.data.some(
                          ({ mountainId }) =>
                            !summitedMountainIds.has(mountainId),
                        ) ? (
                          <p className={styles.summitReminder}>
                            Already climbed one of these? Select it, then mark
                            it “Summited?” in Field Notes to improve future
                            recommendations.
                          </p>
                        ) : null}
                        <button
                          className={styles.download}
                          type="button"
                          onClick={() => downloadRecommendations(visibleOptions)}
                        >
                          Download options (.md)
                        </button>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            ))}

            {isBusy ? (
              <p
                className={styles.thinking}
                aria-label="Mountain guide is responding"
              >
                Finding a thoughtful match…
              </p>
            ) : null}
            <div ref={conversationEnd} />
          </div>

          {error ? (
            <div className={styles.error} role="alert">
              <p>{getGuideErrorMessage(error)}</p>
              <button type="button" onClick={() => void regenerate()}>
                Try again
              </button>
            </div>
          ) : null}

          <form
            ref={formRef}
            className={styles.form}
            onSubmit={submitMessage}
          >
            {!hasConversation ? (
              <label className={styles.experienceField}>
                <span>Your mountain experience</span>
                <select
                  ref={experienceRef}
                  required
                  value={experience}
                  disabled={isBusy}
                  onChange={(event) =>
                    setExperience(event.target.value as MountainExperience)
                  }
                >
                  <option value="" disabled>
                    Choose your experience
                  </option>
                  {EXPERIENCE_OPTIONS.map(([value, option]) => (
                    <option key={value} value={value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className={styles.messageField}>
              <span className={styles.visuallyHidden}>Your priorities</span>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    formRef.current?.requestSubmit();
                  }
                }}
                placeholder={
                  hasConversation
                    ? "Add a detail or answer the follow-up…"
                    : "What matters to you? e.g. a non-technical trek, big views, under two weeks"
                }
                maxLength={1200}
                rows={3}
                disabled={!experience || isBusy}
              />
            </label>
            <div className={styles.formFooter}>
              <span>
                {hasConversation
                  ? "Share another priority or answer the follow-up; your summit list is included."
                  : "Your summit list is included automatically."}
              </span>
              <button
                type="submit"
                disabled={!experience || !input.trim() || isBusy}
                aria-label="Send message"
              >
                {isBusy ? "…" : "Send"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function getGuideErrorMessage(error: Error) {
  try {
    const response = JSON.parse(error.message) as { error?: unknown };

    if (typeof response.error === "string") return response.error;
  } catch {
    // Network and streaming failures do not include the route's JSON error body.
  }

  return "The guide couldn’t respond. Your conversation is still here. Try again in a moment.";
}

function RecommendationCard({
  recommendation,
  onSelect,
}: {
  recommendation: MountainRecommendation;
  onSelect: (summit: MountainCatalogEntry) => void;
}) {
  const mountain = MOUNTAIN_BY_ID.get(recommendation.mountainId);
  if (!mountain) return null;

  return (
    <button
      type="button"
      className={styles.recommendationCard}
      onClick={() => onSelect(mountain)}
    >
      <span className={styles.cardTopline}>
        {recommendation.objective === "summit"
          ? "SUMMIT"
          : recommendation.objective === "trek"
            ? "TREK"
            : "VISIT"}
        <span>{mountain.elevationMeters.toLocaleString()} m</span>
      </span>
      <strong>{mountain.name}</strong>
      <span className={styles.cardLocation}>
        {mountain.location} · {mountain.region}
      </span>
      <span className={styles.matchBadge} data-rating={recommendation.rating}>
        {recommendation.rating[0].toUpperCase() + recommendation.rating.slice(1)} match
      </span>
      <span className={styles.cardReason}>{recommendation.reason}</span>
      <span className={styles.cardAction}>View mountain →</span>
    </button>
  );
}
