import { SiteShell } from "../SiteShell";
import { videoTopics } from "../data";

export default function VideosPage() {
  return (
    <SiteShell>
      <section className="section-block">
        <div className="section-title">
          <p className="eyebrow">Learn</p>
          <h2>Debate videos</h2>
        </div>
        <div className="topic-video-list">
          {(videoTopics ?? []).map((group) => (
            <article className="video-topic-card" key={group.topic}>
              <div className="section-title">
                <p className="eyebrow">Topic</p>
                <h3>{group.topic}</h3>
              </div>
              <div className="level-grid">
                {group.lessons.map((lesson) => (
                  <article className="video-card" key={lesson.title}>
                    {lesson.embedUrl.includes("youtube.com/embed") ? (
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="video-embed"
                        src={lesson.embedUrl}
                        title={lesson.title}
                      />
                    ) : (
                      <div className="video-thumb" aria-hidden="true">
                        <span />
                      </div>
                    )}
                    <div>
                      <small>{lesson.level}</small>
                      <h3>{lesson.title}</h3>
                      <p>{lesson.theme}</p>
                      <small>{lesson.time}</small>
                      <p className="video-source">{lesson.source}</p>
                      <a className="watch-link" href={lesson.embedUrl}>
                        Watch lesson
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
