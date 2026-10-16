"use client";

import { useState } from "react";
import { debateTopics, pickRandomTopic } from "./lib/debate-topics";

export function TopicPicker({ motion, onChange, disabled = false }: { motion: string; onChange: (motion: string) => void; disabled?: boolean }) {
  const [category, setCategory] = useState("All topics");
  const [level, setLevel] = useState("All levels");
  const [isLibraryOpen, setLibraryOpen] = useState(false);
  const topics = debateTopics.filter((topic) =>
    (category === "All topics" || topic.category === category) && (level === "All levels" || topic.level === level),
  );

  return <section className="topic-picker" aria-label="Choose a topic">
    <div className="topic-picker-actions">
      <button className="topic-random-button" type="button" disabled={disabled} onClick={() => onChange(pickRandomTopic(topics).motion)}>
        <span aria-hidden="true">↻</span> New random topic
      </button>
      <button className="topic-library-toggle" type="button" disabled={disabled} aria-expanded={isLibraryOpen} onClick={() => setLibraryOpen((value) => !value)}>
        {isLibraryOpen ? "Close library" : "Choose from library"}
      </button>
    </div>
    {isLibraryOpen && <div className="topic-library-panel">
      <div className="topic-filter-row">
        <label className="topic-select-field"><span>Category</span><select value={category} disabled={disabled} onChange={(event) => setCategory(event.target.value)}><option>All topics</option>{[...new Set(debateTopics.map((topic) => topic.category))].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="topic-select-field"><span>Level</span><select value={level} disabled={disabled} onChange={(event) => setLevel(event.target.value)}><option>All levels</option><option>Junior</option><option>Senior</option></select></label>
      </div>
      <label className="topic-select-field topic-motion-field"><span>Choose a motion</span><select value={motion} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{topics.map((topic) => <option key={topic.id} value={topic.motion}>{topic.motion}</option>)}</select></label>
    </div>}
  </section>;
}
