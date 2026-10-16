"use client";

import { useState } from "react";
import { debateTopics, pickRandomTopic } from "./lib/debate-topics";

export function TopicPicker({ motion, onChange, disabled = false }: { motion: string; onChange: (motion: string) => void; disabled?: boolean }) {
  const [category, setCategory] = useState("All topics");
  const [level, setLevel] = useState("All levels");
  const topics = debateTopics.filter((topic) =>
    (category === "All topics" || topic.category === category) && (level === "All levels" || topic.level === level),
  );

  return <details className="topic-library">
    <summary>Choose a different topic</summary>
    <div className="topic-library-content">
      <div className="topic-filters">
        <label className="debate-field">Category<select value={category} disabled={disabled} onChange={(event) => setCategory(event.target.value)}><option>All topics</option>{[...new Set(debateTopics.map((topic) => topic.category))].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="debate-field">Level<select value={level} disabled={disabled} onChange={(event) => setLevel(event.target.value)}><option>All levels</option><option>Junior</option><option>Senior</option></select></label>
      </div>
      <div className="topic-actions"><button className="secondary-action" type="button" disabled={disabled} onClick={() => onChange(pickRandomTopic(topics).motion)}>Pick another random topic</button><label className="debate-field">Or choose from the library<select value={motion} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{topics.map((topic) => <option key={topic.id} value={topic.motion}>{topic.motion}</option>)}</select></label></div>
    </div>
  </details>;
}
