import { GitHub, LinkedIn, XLogo } from "./Icons";
import Logo from "./Logo";

const columns = [
  {
    heading: "Product",
    links: ["How it works", "What you get", "FAQ"],
  },
  {
    heading: "Company",
    links: ["About", "Careers", "Blog", "Contact"],
  },
];

const socials = [
  { label: "LinkedIn", Icon: LinkedIn },
  { label: "X", Icon: XLogo },
  { label: "GitHub", Icon: GitHub },
];

export default function Footer() {
  return (
    <footer className="bg-brand-soft px-5 pb-14 sm:px-8">
      <div className="border-brand/10 mx-auto grid max-w-6xl gap-12 border-t pt-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="text-muted mt-4 max-w-xs leading-relaxed">
            Matching people to jobs that fit — the team, the pay, the pace.
          </p>
          <ul className="mt-6 flex gap-3">
            {socials.map(({ label, Icon }) => (
              <li key={label}>
                <a
                  href="#"
                  aria-label={label}
                  className="border-brand/15 bg-surface text-muted hover:text-brand grid h-10 w-10 place-items-center rounded-full border transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <h3 className="text-ink text-sm font-semibold tracking-[0.14em] uppercase">
              {column.heading}
            </h3>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted hover:text-brand transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-muted mx-auto mt-12 max-w-6xl text-sm">
        © {new Date().getFullYear()} CareerQueue. All rights reserved.
      </p>
    </footer>
  );
}
