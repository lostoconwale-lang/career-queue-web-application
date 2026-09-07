export type JobCard = {
  company: string;
  logo: string;
  title: string;
  tags: string[];
  salary: string;
};

export const heroJobCards: JobCard[] = [
  {
    company: "Lumen Labs",
    logo: "/images/hero-card-mockup-1.png",
    title: "Senior Product Designer",
    tags: ["Remote", "Full-time"],
    salary: "$120k – $150k",
  },
  {
    company: "Northwind",
    logo: "/images/hero-card-mockup-2.png",
    title: "Frontend Engineer",
    tags: ["Hybrid", "Berlin"],
    salary: "€75k – €95k",
  },
  {
    company: "Persimmon",
    logo: "/images/hero-card-mockup-3.png",
    title: "Growth Marketer",
    tags: ["Remote", "Contract"],
    salary: "$90k – $110k",
  },
];

export const quickFilters = ["Remote", "Design", "Engineering", "Marketing", "Product", "Data"];

export type JobCategory = { _id: string; name: string; openRoles: number };

export const jobCategories: JobCategory[] = [
  { _id: "6710b1c2d3e4f5a600000001", name: "Engineering", openRoles: 3120 },
  { _id: "6710b1c2d3e4f5a600000002", name: "Design", openRoles: 840 },
  { _id: "6710b1c2d3e4f5a600000003", name: "Product", openRoles: 610 },
  { _id: "6710b1c2d3e4f5a600000004", name: "Data & Analytics", openRoles: 970 },
  { _id: "6710b1c2d3e4f5a600000005", name: "Marketing", openRoles: 1180 },
  { _id: "6710b1c2d3e4f5a600000006", name: "Sales", openRoles: 1450 },
  { _id: "6710b1c2d3e4f5a600000007", name: "Operations", openRoles: 520 },
  { _id: "6710b1c2d3e4f5a600000008", name: "Customer Success", openRoles: 430 },
];

export const steps = [
  {
    word: "Search",
    image: "/images/how-it-works-1.png",
    title: "Tell us what you're looking for",
    body: "Role, salary floor, how remote you want to be. Two minutes, no résumé upload required.",
  },
  {
    word: "Match",
    image: "/images/how-it-works-2.png",
    title: "Get matched to relevant roles",
    body: "We rank every open job against what you asked for and show you why each one made the list.",
  },
  {
    word: "Apply",
    image: "/images/how-it-works-3.png",
    title: "Apply in one click",
    body: "Your profile travels with you. No retyping the same work history into six different forms.",
  },
];

export const features = [
  {
    eyebrow: "Smart matching",
    title: "Roles that fit, not roles that shout",
    body: "Every job is scored against your salary floor, location rules and the kind of team you said you work well in. The ones that don't clear the bar never reach your feed.",
    image: "/images/feature-illustration-1.png",
    points: ["Salary-aware ranking", "Explains every match", "Zero ghost listings"],
  },
  {
    eyebrow: "One profile, every application",
    title: "Write your story once",
    body: "Build a profile once and send it anywhere. Track what you've applied to, what's been opened, and what's gone quiet — all on one page.",
    image: "/images/feature-illustration-2.png",
    points: ["One-click apply", "Live application status", "Private until you apply"],
  },
];

export const testimonials = [
  {
    quote:
      "Three weeks from signing up to signing an offer. The matches were the first ones that actually respected my salary floor.",
    name: "Priya Raghunathan",
    role: "Staff Engineer, Cartogram",
    avatar: "/images/avatar-1.png",
  },
  {
    quote:
      "I'd been scrolling job boards for months. CareerQueue showed me eleven roles and four of them were genuinely right.",
    name: "Daniel Okonkwo",
    role: "Product Designer, Halcyon",
    avatar: "/images/avatar-2.png",
  },
  {
    quote:
      "The part I didn't expect: it tells you why a job matched. That alone saved me hours of guessing.",
    name: "Tomás Herrera",
    role: "Data Analyst, Meridian",
    avatar: "/images/avatar-1.png",
  },
  {
    quote:
      "One profile, twelve applications, no retyping my work history a single time. That's the whole pitch and it delivers.",
    name: "Aisling Byrne",
    role: "Marketing Lead, Persimmon",
    avatar: "/images/avatar-2.png",
  },
];

export const faqs = [
  {
    question: "How does matching actually work?",
    answer:
      "You tell us your target role, salary floor, location rules and the kind of team you want. We score every open job against those answers and rank what clears your bar. Each match comes with a short note explaining which of your criteria it hit — and which it missed.",
  },
  {
    question: "Is it really free?",
    answer:
      "Yes, and it stays that way. Searching, matching, your profile and every application are free forever — no trial, no card, no upsell.",
  },
  {
    question: "Will my current employer see my profile?",
    answer:
      "No. Your profile is private until you apply somewhere, and you can block specific companies by name so your details never surface to them even after you do.",
  },
];
