/**
 * Single source of truth for all site content.
 * Edit the values here to update the site — components read from this file.
 * Employers are intentionally anonymized as industry descriptors.
 */

export const site = {
  name: "Biplab Wagle",
  initials: "BW",
  role: "Lead Software Engineer · Full-Stack & AI · Founder",
  email: "biplab@waglegroup.com",
  location: "Charlotte, NC · US Citizen",

  headline: ["I engineer calm,", "AI-powered products", "from idea to shipped."],
  intro:
    "Lead software engineer with 8+ years building enterprise systems for banking, healthcare, and information services — and the founder of GlassFocus. Java & Spring on the backend, React & Angular up front, AI models wired in where they earn their place.",

  socials: {
    glassfocus: "https://www.glassfocus.app/",
    appstore: "https://apps.apple.com/se/app/glassfocus-focus-todos/id6757988398",
    twitter: "https://twitter.com/bipz17",
    linkedin: "https://www.linkedin.com/in/biplab-wagle-3953ba119/",
    // TODO: add your GitHub if you have one
    github: "https://github.com/",
  },
} as const;

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "GlassFocus", href: "#glassfocus" },
  { label: "Work", href: "#work" },
  { label: "Approach", href: "#approach" },
  { label: "Contact", href: "#contact" },
] as const;

export const stats = [
  { value: "8+ years", label: "Full-stack engineering" },
  { value: "Lead SWE", label: "Fortune 500 banking" },
  { value: "GlassFocus", label: "Founder & maker" },
  { value: "AI-native", label: "Models in production" },
] as const;

export const capabilities = [
  {
    key: "backend",
    eyebrow: "01",
    title: "Backend & Microservices",
    blurb:
      "Enterprise-grade Java services that move money and protect health data. Spring Boot microservices, event streaming with Kafka, and REST APIs designed to survive audits and scale.",
    tags: ["Java 11+", "Spring Boot", "Hibernate / JPA", "Kafka", "Microservices", "REST & SOA"],
  },
  {
    key: "frontend",
    eyebrow: "02",
    title: "Frontend Engineering",
    blurb:
      "SPAs that feel effortless — from Angular dashboards used by thousands of internal users to React and Next.js products with motion and polish.",
    tags: ["React", "Angular 2–11", "TypeScript", "Next.js", "Node.js", "Tailwind / SASS"],
  },
  {
    key: "cloud",
    eyebrow: "03",
    title: "Cloud & DevOps",
    blurb:
      "Pipelines and platforms that ship safely. AWS and GCP services, containers on Kubernetes, and CI/CD modernization — Jenkins and UCD to GitHub Actions and Harness.",
    tags: ["AWS", "GCP", "Docker", "Kubernetes", "GitHub Actions", "Harness"],
  },
  {
    key: "ai",
    eyebrow: "04",
    title: "AI & Product",
    blurb:
      "Deep, practical knowledge of LLMs and how to ship them — agents, RAG, tool use, and evals — proven by building GlassFocus end-to-end and landing it on the App Store.",
    tags: ["LLMs", "Agents", "RAG", "Evals", "Product design", "App Store"],
  },
] as const;

export type Experience = {
  role: string;
  org: string;
  type: string;
  period: string;
  location: string;
  bullets: string[];
  skills: string[];
  current?: boolean;
};

export const experience: Experience[] = [
  {
    role: "Lead Software Engineer",
    org: "Fortune 500 Financial Institution",
    type: "Full-time",
    period: "Jul 2025 — Present",
    location: "Charlotte, NC · Hybrid",
    current: true,
    bullets: [
      "Lead development of React SPAs backed by Spring Boot services.",
      "Onboarded automation frameworks for three legacy apps with automated reporting.",
      "Migrated SOAP services to RESTful web services.",
      "Modernized CI/CD — moved pipelines from Jenkins and UCD to GitHub Actions and Harness.",
    ],
    skills: ["React", "Spring Boot", "Kafka", "GitHub Actions", "Harness", "SSRS", "Tech Leadership"],
  },
  {
    role: "Senior Software Engineer",
    org: "Fortune 500 Financial Institution",
    type: "Contract",
    period: "Jul 2024 — Jun 2025",
    location: "Charlotte, NC · Hybrid",
    bullets: [
      "Patched multi-severity Sonar and Checkmarx vulnerabilities across legacy applications.",
      "Migrated legacy Prototype.js front ends to jQuery.",
      "Formulated the modernization plan to move legacy apps onto a current Java, Spring, and Hibernate stack.",
    ],
    skills: ["Java", "Spring", "Hibernate", "Oracle", "JSP", "AppSec", "SDLC"],
  },
  {
    role: "Senior Full-Stack Java Developer",
    org: "Global Information Services Company",
    type: "Contract",
    period: "Aug 2022 — Jul 2024",
    location: "Houston, TX · Remote",
    bullets: [
      "Built Java 11 microservices with Spring Boot and Open Liberty for an integrated eligibility platform.",
      "Designed web apps with Angular 11, Node.js, TypeScript, and SASS.",
      "Used Kafka as the message bus and built data pipelines into Cassandra; ran workloads on AWS (EC2, S3, SQS, SNS, DynamoDB).",
      "Shipped custom Docker images and GitHub Actions CI/CD.",
    ],
    skills: ["Java 11", "Spring Boot", "Angular", "Node.js", "Kafka", "AWS", "Docker", "Cassandra"],
  },
  {
    role: "Full-Stack Java Developer",
    org: "National Healthcare Organization",
    type: "Contract",
    period: "Feb 2021 — Jun 2022",
    location: "Long Beach, CA · Remote",
    bullets: [
      "Built Angular 8 SPAs and Spring Boot REST microservices for Medicaid/Medicare programs.",
      "Implemented RESTful services backed by PostgreSQL and MongoDB.",
      "Developed CI/CD on Jenkins and Kubernetes; deployed Docker containers via AWS CodePipeline and ECS.",
    ],
    skills: ["Angular", "Spring Boot", "PostgreSQL", "MongoDB", "Kubernetes", "Jenkins", "AWS Lambda"],
  },
  {
    role: "Java / J2EE Developer",
    org: "Regional Banking Group",
    type: "Contract",
    period: "Sep 2019 — Dec 2020",
    location: "St. Louis, MO · Remote",
    bullets: [
      "Developed Spring Boot microservices communicating over Kafka (cluster setup with ZooKeeper).",
      "Built REST APIs with Spring JPA and server-side services in Node.js.",
      "Automated end-to-end testing with REST Assured and Selenium; messaging with RabbitMQ and ActiveMQ.",
    ],
    skills: ["Spring Boot", "Kafka", "Hibernate", "RabbitMQ", "Selenium", "Spring JPA"],
  },
  {
    role: "Java Developer",
    org: "Enterprise Technology Integrator",
    type: "Contract",
    period: "Aug 2017 — Jul 2019",
    location: "New Jersey · On-site",
    bullets: [
      "Developed RESTful APIs integrated with AWS DynamoDB for member health records.",
      "Implemented authentication and authorization with Spring Security.",
      "Integrated with a major Electronic Health System via JAX-RS / Jersey web services.",
    ],
    skills: ["Core Java", "Spring Security", "DynamoDB", "REST", "Hibernate", "Maven"],
  },
];

export const education = [
  {
    degree: "B.A.A.S. — Data Analytics",
    detail: "Bachelor of Applied Arts and Science, concentration in Data Analytics",
  },
  {
    degree: "A.A.S. — Programming",
    detail: "Associate of Applied Science, concentration in Programming",
  },
] as const;

export const glassFocus = {
  name: "GlassFocus",
  tagline: "The calm way to do deep work.",
  description:
    "A gorgeous Pomodoro timer for deep work — with tasks, ambient soundscapes, analytics, and journaling in one calm, cinematic app. Designed, built, and shipped end-to-end.",
  features: [
    "Living progress rings & particle visualizations",
    "Two-way Todoist sync and Notion databases",
    "Mixable soundscapes + Spotify / Apple Music",
    "Productivity scoring, streaks & peak-hours analytics",
    "ADHD-friendly: visual pie timer & micro-celebrations",
    "Reflective monthly journal for mood & energy",
  ],
  platforms: ["iPhone", "iPad", "Mac", "Web"],
  links: {
    site: "https://www.glassfocus.app/",
    appstore: "https://apps.apple.com/se/app/glassfocus-focus-todos/id6757988398",
  },
} as const;

export type Project = {
  title: string;
  category: string;
  description: string;
  tags: string[];
  href?: string;
  featured?: boolean;
  status?: string;
};

export const projects: Project[] = [
  {
    title: "GlassFocus",
    category: "Product · Founder",
    description:
      "A cinematic focus app combining a Pomodoro timer with tasks, soundscapes, analytics, and journaling. Live on iPhone, iPad, Mac & the web.",
    tags: ["SwiftUI", "Web", "Design", "Analytics"],
    href: "https://www.glassfocus.app/",
    featured: true,
    status: "Live",
  },
  {
    title: "Enterprise Platform Modernization",
    category: "Banking · Lead",
    description:
      "Modernizing a Fortune 500 bank's legacy estate — SOAP to REST migrations, automation frameworks with reporting for three legacy apps, and CI/CD moved to GitHub Actions and Harness.",
    tags: ["Java", "Spring Boot", "React", "Harness"],
    status: "Ongoing",
  },
  {
    title: "AI Product Engineering",
    category: "AI · Build",
    description:
      "Designing and shipping LLM-powered features — agents, retrieval, and tool use — wired into real, polished product surfaces with evals that keep them honest.",
    tags: ["LLMs", "Agents", "RAG", "Next.js"],
    status: "Ongoing",
  },
];

export const approach = [
  {
    step: "01",
    title: "Discover",
    blurb:
      "Understand the problem, the user, and the constraints before a single line of code. Sharp scope beats big scope.",
  },
  {
    step: "02",
    title: "Design",
    blurb:
      "Move fast in the interface — prototype the feel, the motion, and the edges until it’s obviously right.",
  },
  {
    step: "03",
    title: "Build with AI",
    blurb:
      "Use models as leverage, not magic — agents and LLMs accelerate the build while I keep quality and correctness in the loop.",
  },
  {
    step: "04",
    title: "Ship",
    blurb:
      "Production-ready or it doesn’t count: performance, accessibility, and the polish that makes software feel alive.",
  },
] as const;

export const techMarquee = [
  "Java",
  "Spring Boot",
  "React",
  "Angular",
  "TypeScript",
  "Next.js",
  "Node.js",
  "Kafka",
  "AWS",
  "GCP",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MongoDB",
  "Oracle",
  "GitHub Actions",
  "Harness",
  "LLMs",
  "RAG",
  "Agents",
  "SwiftUI",
] as const;
