// Placeholder listing data shaped exactly like the real API DTOs, so swapping
// this module for a real fetch/service call later is a one-line change in
// `app/jobs/page.tsx`. Nothing here is wired to the database.
import { EMPTY_SEO } from "@/types/seo";
import type { CategoryDTO } from "@/types/category";
import type { JobTypeDTO } from "@/types/job-type";
import type { JobDTO } from "@/types/job";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

function category(id: string, name: string): CategoryDTO {
  return {
    id,
    name,
    description: "",
    icon: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
  };
}

function jobType(id: string, name: string): JobTypeDTO {
  return {
    id,
    name,
    description: "",
    isActive: true,
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
  };
}

// Same ids as the marketing homepage's `jobCategories` (app/_data.ts), so the
// "Popular job categories" tiles link straight into a pre-filtered listing.
const ENG = category("6710b1c2d3e4f5a600000001", "Engineering");
const DESIGN = category("6710b1c2d3e4f5a600000002", "Design");
const PRODUCT = category("6710b1c2d3e4f5a600000003", "Product");
const DATA = category("6710b1c2d3e4f5a600000004", "Data & Analytics");
const MARKETING = category("6710b1c2d3e4f5a600000005", "Marketing");
const SALES = category("6710b1c2d3e4f5a600000006", "Sales");
const OPS = category("6710b1c2d3e4f5a600000007", "Operations");
const SUCCESS = category("6710b1c2d3e4f5a600000008", "Customer Success");

export const CATEGORIES: CategoryDTO[] = [
  ENG,
  DESIGN,
  PRODUCT,
  DATA,
  MARKETING,
  SALES,
  OPS,
  SUCCESS,
];

const FULL_TIME = jobType("6710b1c2d3e4f5a600000101", "Full-time");
const PART_TIME = jobType("6710b1c2d3e4f5a600000102", "Part-time");
const CONTRACT = jobType("6710b1c2d3e4f5a600000103", "Contract");
const INTERN = jobType("6710b1c2d3e4f5a600000104", "Internship");
const REMOTE = jobType("6710b1c2d3e4f5a600000105", "Remote");
const HYBRID = jobType("6710b1c2d3e4f5a600000106", "Hybrid");

export const JOB_TYPES: JobTypeDTO[] = [
  FULL_TIME,
  PART_TIME,
  CONTRACT,
  INTERN,
  REMOTE,
  HYBRID,
];

function cat(...items: CategoryDTO[]) {
  return items.map((c) => ({ id: c.id, name: c.name }));
}
function type(...items: JobTypeDTO[]) {
  return items.map((t) => ({ id: t.id, name: t.name }));
}
function company(id: string, name: string) {
  return { id, name, logo: null };
}

const shortDescription = (role: string, company_: string) => `
  <p>${company_} is looking for a ${role} to join a small, senior team shipping features that customers actually notice. You'll work closely with design and product from day one.</p>
  <h2>What you'll do</h2>
  <ul>
    <li>Own features end-to-end, from a rough idea to something in customers' hands</li>
    <li>Pair with teammates across disciplines instead of working in a silo</li>
    <li>Push back on scope when it doesn't serve the goal</li>
  </ul>
`;

const longDescription = (role: string, company_: string) => `
  <p>${company_} is hiring an experienced ${role} to help us rebuild the core of our platform while keeping the lights on for a few hundred thousand daily users. This is a senior, high-autonomy role on a team that ships weekly and reviews its own decisions honestly.</p>
  <h2>What you'll do</h2>
  <ul>
    <li>Design and build systems that hold up under real production load, not just a demo</li>
    <li>Set technical direction for a small team and defend it in writing</li>
    <li>Pair with product and design from the first sketch, not after the spec is "final"</li>
    <li>Mentor two or three engineers earlier in their career</li>
    <li>Rotate on-call roughly one week in six, with a team that actually shares the load</li>
  </ul>
  <h3>What we're looking for</h3>
  <ul>
    <li>6+ years shipping production software, ideally with some of it in a small-team setting</li>
    <li>Comfort making a call with incomplete information and revisiting it if you're wrong</li>
    <li>Direct, low-drama communication — you'll get plenty of it back</li>
  </ul>
  <h3>Nice to have</h3>
  <p>Experience with distributed systems, prior startup experience, or a track record of mentoring — none of these are required, all of them help.</p>
  <blockquote>We interview for judgment, not trivia. Expect a real conversation about a real problem, not a whiteboard algorithm test.</blockquote>
`;

const IMG = {
  professional: {
    id: "media-1",
    key: "images/hero-professional.png",
    url: "/images/hero-professional.png",
  },
  feature1: { id: "media-2", key: "images/feature-illustration-1.png", url: "/images/feature-illustration-1.png" },
  feature2: { id: "media-3", key: "images/feature-illustration-2.png", url: "/images/feature-illustration-2.png" },
  feature3: { id: "media-4", key: "images/feature-illustration-3.png", url: "/images/feature-illustration-3.png" },
  step1: { id: "media-5", key: "images/how-it-works-1.png", url: "/images/how-it-works-1.png" },
};

export const JOBS: JobDTO[] = [
  {
    id: "job-01",
    title: "Senior Product Designer",
    description: shortDescription("Senior Product Designer", "Lumen Labs"),
    categories: cat(DESIGN, PRODUCT),
    jobTypes: type(FULL_TIME, REMOTE),
    company: company("company-01", "Lumen Labs"),
    coverImage: IMG.feature1,
    thumbnail: IMG.feature1,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
  },
  {
    id: "job-02",
    title: "Staff Backend Engineer — Payments Platform",
    description: longDescription("Staff Backend Engineer", "Northwind"),
    categories: cat(ENG, DATA, PRODUCT, OPS, SALES),
    jobTypes: type(FULL_TIME, CONTRACT, REMOTE, HYBRID),
    company: company("company-02", "Northwind Financial Technologies International"),
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
  },
  {
    id: "job-03",
    title: "Growth Marketer",
    description: shortDescription("Growth Marketer", "Persimmon"),
    categories: cat(MARKETING),
    jobTypes: type(CONTRACT),
    company: company("company-03", "Persimmon"),
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "job-04",
    title: "Frontend Engineer, Design Systems",
    description: shortDescription("Frontend Engineer", "Halcyon"),
    categories: cat(ENG, DESIGN),
    jobTypes: type(FULL_TIME, HYBRID),
    company: company("company-04", "Halcyon"),
    coverImage: IMG.feature2,
    thumbnail: IMG.feature2,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "job-05",
    title: "Data Analyst",
    description: shortDescription("Data Analyst", "Meridian"),
    categories: cat(DATA),
    jobTypes: type(FULL_TIME),
    company: company("company-05", "Meridian"),
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: "job-06",
    title: "Customer Success Manager",
    description: shortDescription("Customer Success Manager", "Cartogram"),
    categories: cat(SUCCESS, SALES),
    jobTypes: type(FULL_TIME),
    company: company("company-06", "Cartogram"),
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  {
    id: "job-07",
    title: "Operations Associate",
    description: shortDescription("Operations Associate", "Fernway"),
    categories: cat(OPS),
    jobTypes: type(PART_TIME, HYBRID),
    company: company("company-07", "Fernway"),
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "job-08",
    title: "Product Manager, Platform",
    description: longDescription("Product Manager", "Auric"),
    categories: cat(PRODUCT, ENG),
    jobTypes: type(FULL_TIME, REMOTE),
    company: company("company-08", "Auric"),
    coverImage: IMG.professional,
    thumbnail: IMG.professional,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
  {
    id: "job-09",
    title: "Software Engineering Intern",
    description: shortDescription("Software Engineering Intern", "Rivet"),
    categories: cat(ENG),
    jobTypes: type(INTERN),
    company: company("company-09", "Rivet"),
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(8),
  },
  {
    id: "job-10",
    title: "Brand & Content Designer",
    description: shortDescription("Brand & Content Designer", "Waymark"),
    categories: cat(DESIGN, MARKETING),
    jobTypes: type(FULL_TIME, REMOTE),
    company: company("company-10", "Waymark"),
    coverImage: IMG.feature3,
    thumbnail: IMG.feature3,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
  },
  {
    id: "job-11",
    title: "Enterprise Account Executive",
    description: shortDescription("Enterprise Account Executive", "Northwind"),
    categories: cat(SALES),
    jobTypes: type(FULL_TIME),
    company: company("company-02", "Northwind Financial Technologies International"),
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(11),
    updatedAt: daysAgo(11),
  },
  {
    id: "job-12",
    title: "Platform Reliability Engineer",
    description: longDescription("Platform Reliability Engineer", "Lumen Labs"),
    categories: cat(ENG, OPS),
    jobTypes: type(FULL_TIME, HYBRID),
    company: company("company-01", "Lumen Labs"),
    coverImage: IMG.step1,
    thumbnail: IMG.step1,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(14),
  },
  {
    id: "job-13",
    title: "Junior Data Analyst",
    description: shortDescription("Junior Data Analyst", "Meridian"),
    categories: cat(DATA, SUCCESS),
    jobTypes: type(PART_TIME, INTERN),
    company: company("company-05", "Meridian"),
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(18),
    updatedAt: daysAgo(18),
  },
  {
    id: "job-14",
    title: "Contract Recruiter",
    description: shortDescription("Contract Recruiter", "an early-stage team"),
    // No company attached yet — exercises the "no company" fallback state.
    categories: cat(OPS, SUCCESS),
    jobTypes: type(CONTRACT, REMOTE),
    company: null,
    coverImage: null,
    thumbnail: null,
    seo: EMPTY_SEO,
    isActive: true,
    createdAt: daysAgo(23),
    updatedAt: daysAgo(23),
  },
];
