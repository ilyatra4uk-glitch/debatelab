"use client";

import { useMemo, useState } from "react";

type Mode = "bot" | "friend";

const topics = [
  "Should schools replace homework with project time?",
  "Should social media platforms verify every user?",
  "Is remote work better for creativity?",
  "Should cities ban private cars from downtown areas?",
  "Should AI tools be allowed in exams?",
];

const videoLessons = [
  {
    title: "Opening Arguments",
    level: "Beginner",
    time: "7 min",
    theme: "Claim, warrant, impact",
  },
  {
    title: "Cross Examination",
    level: "Intermediate",
    time: "11 min",
    theme: "Ask narrow questions",
  },
  {
    title: "Rebuttal Strategy",
    level: "Advanced",
    time: "14 min",
    theme: "Weighing and clash",
  },
];

const competitions = [
  {
    title: "Saturday Sprint",
    format: "3 rounds",
    prize: "Global ranking points",
    status: "Open",
  },
  {
    title: "Schools Cup",
    format: "Team debate",
    prize: "Mentor review",
    status: "Soon",
  },
  {
    title: "AI Challenge Ladder",
    format: "Solo vs bot",
    prize: "Weekly badge",
    status: "Live",
  },
];

const achievements = [
  { label: "Debates won", value: "18" },
  { label: "Best speaker", value: "6" },
  { label: "Practice streak", value: "12d" },
];

const friends = [
  { name: "Maya", record: "14 wins", status: "Online" },
  { name: "Leo", record: "9 wins", status: "In round" },
  { name: "Ari", record: "22 wins", status: "Online" },
];

const botReplies = [
  "Your argument depends on a benefit, but it needs stronger proof that the benefit happens often enough to outweigh the harm.",
  "I agree the goal matters, but your policy creates a tradeoff. My side wins if the risk lands on more people than the advantage helps.",
  "That example is useful, but it is narrow. A stronger case needs a principle that still works when the topic gets harder.",
];

function scoreText(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const structure =
    Number(/\b(because|therefore|first|second|impact|evidence)\b/i.test(text)) *
    18;
  const clash =
    Number(/\b(their|opponent|rebut|however|but)\b/i.test(text)) * 16;
  return Math.min(96, 38 + Math.min(words, 90) * 0.34 + structure + clash);
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("bot");
  const [topic, setTopic] = useState(topics[0]);
  const [userSpeech, setUserSpeech] = useState(
    "Students should use project time instead of homework because it helps them practice research, teamwork, and public speaking in a more realistic way.",
  );
  const [friendSpeech, setFriendSpeech] = useState(
    "Homework should stay because it builds discipline and gives teachers a clear way to check individual understanding outside group work.",
  );

  const botSpeech = useMemo(() => {
    const index = Math.abs(userSpeech.length + topic.length) % botReplies.length;
    return botReplies[index];
  }, [topic, userSpeech]);

  const opponentSpeech = mode === "bot" ? botSpeech : friendSpeech;
  const userScore = Math.round(scoreText(userSpeech));
  const opponentScore = Math.round(scoreText(opponentSpeech) - (mode === "bot" ? 3 : 0));
  const winner =
    userScore === opponentScore
      ? "Draw"
      : userScore > opponentScore
        ? "You win"
        : mode === "bot"
          ? "Bot wins"
          : "Friend wins";

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#151515]">
      <section className="arena-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">DebateLab</p>
            <h1>Your debate command center.</h1>
          </div>
          <div className="mode-switch" aria-label="Debate mode">
            <button
              className={mode === "bot" ? "active" : ""}
              onClick={() => setMode("bot")}
              type="button"
            >
              Bot
            </button>
            <button
              className={mode === "friend" ? "active" : ""}
              onClick={() => setMode("friend")}
              type="button"
            >
              Friend
            </button>
          </div>
        </header>

        <section className="dashboard-grid" aria-label="Profile dashboard">
          <article className="profile-panel">
            <div className="avatar" aria-hidden="true">
              IK
            </div>
            <div>
              <p className="eyebrow">Profile</p>
              <h2>Ilya K.</h2>
              <p>
                Strategic speaker - ranked #42 this month - strongest in
                rebuttals.
              </p>
            </div>
          </article>

          <article className="achievement-panel">
            <p className="eyebrow">Achievements</p>
            <div className="achievement-list">
              {achievements.map((achievement) => (
                <div key={achievement.label}>
                  <strong>{achievement.value}</strong>
                  <span>{achievement.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="friends-panel">
            <p className="eyebrow">Friends</p>
            <div className="friend-list">
              {friends.map((friend) => (
                <button key={friend.name} type="button">
                  <span>
                    <strong>{friend.name}</strong>
                    <small>{friend.record}</small>
                  </span>
                  <em>{friend.status}</em>
                </button>
              ))}
            </div>
          </article>

          <article className="available-panel">
            <p className="eyebrow">Available</p>
            <h2>{competitions[0].title}</h2>
            <p>{competitions[0].format} - {competitions[0].prize}</p>
            <button type="button">Enter</button>
          </article>
        </section>

        <section className="hero-grid">
          <div className="debate-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Current motion</p>
                <select
                  aria-label="Choose debate topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                >
                  {topics.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <span className="timer">08:00</span>
            </div>

            <div className="speech-grid">
              <label>
                <span>Your speech</span>
                <textarea
                  value={userSpeech}
                  onChange={(event) => setUserSpeech(event.target.value)}
                  aria-label="Your debate speech"
                />
              </label>

              <label>
                <span>{mode === "bot" ? "Bot response" : "Friend speech"}</span>
                <textarea
                  value={opponentSpeech}
                  onChange={(event) => setFriendSpeech(event.target.value)}
                  readOnly={mode === "bot"}
                  aria-label={mode === "bot" ? "Bot response" : "Friend speech"}
                />
              </label>
            </div>
          </div>

          <aside className="judge-panel" aria-live="polite">
            <p className="eyebrow">Judge decision</p>
            <h2>{winner}</h2>
            <div className="score-row">
              <span>You</span>
              <strong>{userScore}</strong>
            </div>
            <div className="meter">
              <span style={{ width: `${userScore}%` }} />
            </div>
            <div className="score-row">
              <span>{mode === "bot" ? "Bot" : "Friend"}</span>
              <strong>{opponentScore}</strong>
            </div>
            <div className="meter alt">
              <span style={{ width: `${opponentScore}%` }} />
            </div>
            <div className="feedback">
              <h3>Work on next</h3>
              <p>
                Add clearer evidence, directly answer the other side, and finish
                with why your impact matters more.
              </p>
            </div>
          </aside>
        </section>

        <section className="content-grid">
          <div className="section-block">
            <div className="section-title">
              <p className="eyebrow">Learn</p>
              <h2>Debate videos</h2>
            </div>
            <div className="video-list">
              {videoLessons.map((lesson) => (
                <article className="video-card" key={lesson.title}>
                  <div className="video-thumb" aria-hidden="true">
                    <span />
                  </div>
                  <div>
                    <h3>{lesson.title}</h3>
                    <p>{lesson.theme}</p>
                    <small>
                      {lesson.level} - {lesson.time}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="section-block">
            <div className="section-title">
              <p className="eyebrow">Compete</p>
              <h2>Available competitions</h2>
            </div>
            <div className="competition-list">
              {competitions.map((competition) => (
                <article className="competition-card" key={competition.title}>
                  <span>{competition.status}</span>
                  <h3>{competition.title}</h3>
                  <p>{competition.format}</p>
                  <strong>{competition.prize}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
