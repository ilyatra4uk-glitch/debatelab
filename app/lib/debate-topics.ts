export type DebateTopic = { id: string; motion: string; category: string; level: "Junior" | "Senior" };

// Original practice motions inspired by recurring themes in Irish school programmes.
// These are not a ranked list or a reproduction of official competition motions.
export const topicSources = [
  { name: "Educate Together junior debating", url: "https://www.educatetogether.ie/update/debating-call-for-schools/" },
  { name: "Concern Debates resources", url: "https://www.concern.net/schools-and-youth/debates/materials" },
  { name: "Trinity: Debating Science Issues", url: "https://www.tcd.ie/crann/education-and-outreach/schools-programme/debating-science-issues/" },
];

const groups: Array<{ category: string; motions: Array<[string, "Junior" | "Senior"]> }> = [
  { category: "School & learning", motions: [
    ["Secondary schools should abolish homework.", "Junior"],
    ["School uniforms should be optional.", "Junior"],
    ["Secondary schools should start later in the morning.", "Junior"],
    ["Mobile phones should be kept out of classrooms.", "Junior"],
    ["Schools should replace some exams with project work.", "Junior"],
    ["Transition Year should be available to every student.", "Junior"],
    ["The Leaving Certificate should rely less on final written exams.", "Senior"],
    ["Students should have a vote in major school decisions.", "Junior"],
    ["Irish should remain a compulsory subject at Leaving Certificate level.", "Senior"],
    ["Financial literacy should be a compulsory school subject.", "Junior"],
  ] },
  { category: "Technology & media", motions: [
    ["Social media does more harm than good for teenagers.", "Junior"],
    ["Schools should teach students how to use AI responsibly.", "Junior"],
    ["Students should be allowed to use AI for homework if they explain how they used it.", "Senior"],
    ["Social media platforms should be responsible for removing false information.", "Senior"],
    ["Influencers should be held to the same advertising standards as television presenters.", "Junior"],
    ["Technology companies should not be allowed to target advertising at children.", "Junior"],
    ["Online anonymity does more good than harm.", "Senior"],
    ["Public-service broadcasting is more important than ever.", "Senior"],
    ["Protecting free speech matters more than avoiding offence.", "Senior"],
    ["Schools should teach media literacy as a separate subject.", "Junior"],
  ] },
  { category: "Climate & sustainability", motions: [
    ["Public transport should be free for everyone in Ireland.", "Junior"],
    ["Ireland should prioritise cycling and walking over private cars in towns.", "Junior"],
    ["Schools should serve a vegetarian lunch at least once a week.", "Junior"],
    ["Fast fashion should carry an environmental tax.", "Senior"],
    ["Governments, rather than individuals, should take the main responsibility for climate action.", "Junior"],
    ["Ireland should invest more in offshore wind energy.", "Senior"],
    ["The environmental cost of flying should be reflected in ticket prices.", "Senior"],
    ["Wealthier countries should pay more to help countries affected by climate change.", "Senior"],
    ["Protecting biodiversity should take priority over new development.", "Senior"],
    ["Schools should replace international trips with local trips to reduce emissions.", "Junior"],
  ] },
  { category: "Ireland & community", motions: [
    ["The voting age in Ireland should be lowered to sixteen.", "Senior"],
    ["Every town should have a publicly funded youth centre.", "Junior"],
    ["Housing should be treated primarily as a public service rather than an investment.", "Senior"],
    ["Rural public services should receive more funding even when they serve fewer people.", "Senior"],
    ["Community volunteering should be part of secondary education.", "Junior"],
    ["Irish-language media should receive more public funding.", "Senior"],
    ["Public funding for sport should prioritise participation over elite performance.", "Junior"],
    ["Museums and cultural attractions should be free for young people.", "Junior"],
    ["Tourism brings more benefits than costs to local communities in Ireland.", "Junior"],
    ["Student employment is a better use of summer holidays than extra academic study.", "Junior"],
  ] },
  { category: "Global citizenship & science", motions: [
    ["Fair-trade products should be the default choice in school canteens.", "Junior"],
    ["Education is the most effective way to reduce global poverty.", "Junior"],
    ["Wealthier countries should increase spending on international development.", "Senior"],
    ["Access to clean water should take priority over other development goals.", "Junior"],
    ["Trade is more effective than aid at reducing global inequality.", "Senior"],
    ["International cooperation is more effective than national action on global problems.", "Senior"],
    ["Countries should prioritise reducing inequality over growing their economies.", "Senior"],
    ["Space exploration is worth the public money spent on it.", "Junior"],
    ["Scientific innovation is the best way to tackle environmental problems.", "Senior"],
    ["Companies should be responsible for working conditions throughout their supply chains.", "Senior"],
  ] },
];

export const debateTopics: DebateTopic[] = groups.flatMap((group, groupIndex) => group.motions.map(([motion, level], index) => ({
  id: `topic-${groupIndex * 10 + index + 1}`, motion, category: group.category, level,
})));

export function pickRandomTopic(topics: DebateTopic[], random = Math.random): DebateTopic {
  if (!topics.length) throw new Error("No topics match these filters.");
  return topics[Math.min(topics.length - 1, Math.floor(random() * topics.length))];
}
