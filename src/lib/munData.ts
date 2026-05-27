// PRUMUN reference data — committees, agendas, portfolios

export type Committee = {
  id: string;
  name: string;
  shortName: string;
  agenda: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  portfolios: string[];
};

export const COMMITTEES: Committee[] = [
  {
    id: "unsc",
    name: "United Nations Security Council",
    shortName: "UNSC",
    agenda: "The situation in the Indo-Pacific with emphasis on maritime security",
    description: "The most powerful body of the UN, dealing with matters of international peace and security.",
    difficulty: "Advanced",
    portfolios: [
      "United States of America", "Russian Federation", "People's Republic of China",
      "United Kingdom", "France", "India", "Japan", "Germany", "Brazil",
      "South Africa", "United Arab Emirates", "Republic of Korea",
      "Australia", "Indonesia", "Vietnam"
    ],
  },
  {
    id: "unhrc",
    name: "United Nations Human Rights Council",
    shortName: "UNHRC",
    agenda: "Addressing human rights violations in conflict zones with focus on protection of civilians",
    description: "Promoting and protecting human rights worldwide.",
    difficulty: "Intermediate",
    portfolios: [
      "United States", "United Kingdom", "France", "Germany", "Canada",
      "India", "China", "Russia", "Brazil", "Argentina", "Mexico",
      "Saudi Arabia", "Qatar", "Iran", "Israel", "Palestine",
      "Ukraine", "Poland", "Switzerland", "Norway"
    ],
  },
  {
    id: "disec",
    name: "Disarmament & International Security Committee",
    shortName: "DISEC",
    agenda: "Regulation of autonomous weapons systems and emerging military AI",
    description: "First committee of the General Assembly dealing with global security challenges.",
    difficulty: "Intermediate",
    portfolios: [
      "USA", "Russia", "China", "India", "Pakistan", "France", "UK",
      "North Korea", "South Korea", "Japan", "Iran", "Israel", "Turkey",
      "Egypt", "Saudi Arabia", "Brazil", "Argentina", "Australia",
      "Germany", "Italy", "Spain", "Sweden"
    ],
  },
  {
    id: "ecosoc",
    name: "Economic & Social Council",
    shortName: "ECOSOC",
    agenda: "Sustainable economic recovery in post-pandemic developing nations",
    description: "Coordinating economic, social and related work of UN specialized agencies.",
    difficulty: "Beginner",
    portfolios: [
      "United States", "China", "India", "Brazil", "Russia", "Japan",
      "Germany", "United Kingdom", "France", "Canada", "Australia",
      "South Africa", "Nigeria", "Kenya", "Egypt", "Mexico",
      "Indonesia", "Vietnam", "Thailand", "Bangladesh"
    ],
  },
  {
    id: "ail",
    name: "All India Political Parties Meet",
    shortName: "AIPPM",
    agenda: "Uniform Civil Code: balancing diversity and equality",
    description: "Indian political simulation with leaders from major parties.",
    difficulty: "Intermediate",
    portfolios: [
      "Narendra Modi", "Rahul Gandhi", "Mamata Banerjee", "Arvind Kejriwal",
      "M. K. Stalin", "Akhilesh Yadav", "Sharad Pawar", "Asaduddin Owaisi",
      "Mehbooba Mufti", "Sitaram Yechury", "Yogi Adityanath", "Amit Shah",
      "Priyanka Gandhi", "Tejashwi Yadav", "Naveen Patnaik", "K. Chandrashekar Rao"
    ],
  },
  {
    id: "ipc",
    name: "International Press Corps",
    shortName: "IPC",
    agenda: "Reporting and Photography across all committees",
    description: "Journalists, photographers and caricaturists covering the conference.",
    difficulty: "Beginner",
    portfolios: [
      "Reuters Journalist", "BBC Correspondent", "Al Jazeera Reporter",
      "The New York Times", "The Hindu", "The Guardian", "CNN",
      "AP Photographer", "Caricaturist (Political)", "Caricaturist (Cultural)",
      "Times of India", "Washington Post"
    ],
  },
];

export const EVENT_DATE = new Date("2026-08-01T09:00:00+05:30");

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/prumun",
  youtube: "https://youtube.com/@prumun",
  facebook: "https://facebook.com/prumun",
};

export const VENUE = {
  name: "Prudence School, Sector 22 Dwarka",
  address: "Sector 22, Dwarka, New Delhi, 110077",
  mapsQuery: "Prudence+School+Sector+22+Dwarka+New+Delhi",
};
