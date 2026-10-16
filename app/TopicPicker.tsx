"use client";
import { useState } from "react";
import { debateTopics, pickRandomTopic, topicSources } from "./lib/debate-topics";

export function TopicPicker({ motion, onChange, disabled = false }: { motion: string; onChange: (motion: string) => void; disabled?: boolean }) {
  const [category, setCategory] = useState("All topics");
  const [level, setLevel] = useState("All levels");
  const [query, setQuery] = useState("");
  const [random, setRandom] = useState(false);
  const topics = debateTopics.filter((topic) => (category === "All topics" || topic.category === category) &&
    (level === "All levels" || topic.level === level) && topic.motion.toLowerCase().includes(query.toLowerCase()));
  return <fieldset className="topic-library" disabled={disabled}>
    <legend>Choose your topic</legend>
    <p className="tool-copy">50 practice motions for secondary school in Ireland. Junior and Senior labels suggest a starting difficulty.</p>
    <div className="topic-filters">
      <label className="debate-field">Category<select value={category} onChange={(event) => { setCategory(event.target.value); setRandom(false); }}><option>All topics</option>{[...new Set(debateTopics.map((topic) => topic.category))].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="debate-field">Level<select value={level} onChange={(event) => { setLevel(event.target.value); setRandom(false); }}><option>All levels</option><option>Junior</option><option>Senior</option></select></label>
      <label className="debate-field">Search<input value={query} onChange={(event) => { setQuery(event.target.value); setRandom(false); }} placeholder="e.g. school, climate, AI" /></label>
    </div>
    <label className="random-choice"><input type="checkbox" checked={random} disabled={!topics.length || disabled} onChange={(event) => { setRandom(event.target.checked); if (event.target.checked) onChange(pickRandomTopic(topics).motion); }} />Pick a random topic from these results</label>
    {random ? <button className="secondary-action" type="button" onClick={() => onChange(pickRandomTopic(topics).motion)}>Pick another random topic</button> : <label className="debate-field">Topic · {topics.length} available<select size={5} value={topics.some((topic) => topic.motion === motion) ? motion : ""} onChange={(event) => onChange(event.target.value)}>{topics.map((topic) => <option key={topic.id} value={topic.motion}>{topic.motion}</option>)}</select></label>}
    {!topics.length && <p role="status">No topics match. Try another search or filter.</p>}
    <div className="selected-topic" aria-live="polite"><span className="eyebrow">Your motion</span><strong>{motion}</strong></div>
    <details className="topic-sources"><summary>About this library</summary><p>Original practice motions inspired by themes in Irish school debating programmes. This is not an official competition list or a ranking of the most frequent motions.</p>{topicSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a>)}</details>
  </fieldset>;
}
