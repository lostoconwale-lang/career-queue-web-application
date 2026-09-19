export type JobCard = {
  company: string;
  logo: string;
  title: string;
  tags: string[];
  salary: string;
  href: string | null;
};

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
