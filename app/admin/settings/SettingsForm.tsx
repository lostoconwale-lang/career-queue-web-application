"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, FormEvent, ReactNode } from "react";

import { AuthField } from "@/app/_components/AuthField";
import {
  Close,
  Facebook,
  Instagram,
  LinkedIn,
  Mail,
  Plus,
  XLogo,
  YouTube,
} from "@/app/_components/Icons";
import { ImageField } from "@/app/admin/_components/ImageField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { emailSchema } from "@/lib/validators/common";
import type { ApiResponse } from "@/types/api";
import type { EmbeddedMediaDTO } from "@/types/media";
import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABELS,
  type SettingsDTO,
  type SocialPlatform,
} from "@/types/settings";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

type TabKey = "branding" | "notifications" | "seo" | "social";
const TABS: { key: TabKey; label: string }[] = [
  { key: "branding", label: "Branding" },
  { key: "notifications", label: "Notifications" },
  { key: "seo", label: "SEO" },
  { key: "social", label: "Social" },
];

const SOCIAL_ICONS: Record<SocialPlatform, ComponentType<{ className?: string }>> = {
  youtube: YouTube,
  linkedin: LinkedIn,
  x: XLogo,
  instagram: Instagram,
  facebook: Facebook,
};

const SOCIAL_PLACEHOLDERS: Record<SocialPlatform, string> = {
  youtube: "https://youtube.com/@yourbrand",
  linkedin: "https://linkedin.com/company/yourbrand",
  x: "https://x.com/yourbrand",
  instagram: "https://instagram.com/yourbrand",
  facebook: "https://facebook.com/yourbrand",
};

const emptySocial = () =>
  Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, ""])) as Record<SocialPlatform, string>;

const splitKeywords = (input: string) =>
  input
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

const looksLikeUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

function fieldTab(field: string): TabKey {
  if (field.startsWith("social-")) return "social";
  return "branding";
}

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("branding");

  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [logoLight, setLogoLight] = useState<EmbeddedMediaDTO | null>(null);
  const [logoDark, setLogoDark] = useState<EmbeddedMediaDTO | null>(null);

  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [ogImage, setOgImage] = useState<EmbeddedMediaDTO | null>(null);

  const [social, setSocial] = useState<Record<SocialPlatform, string>>(emptySocial);

  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/settings", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<SettingsDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        const s = json.data;
        setSiteName(s.siteName);
        setTagline(s.tagline);
        setContactEmail(s.contactEmail);
        setContactPhone(s.contactPhone);
        setLogoLight(s.logoLight);
        setLogoDark(s.logoDark);
        setNotificationEmails(s.notificationEmails);
        setMetaTitle(s.seo.metaTitle);
        setMetaDescription(s.seo.metaDescription);
        setMetaKeywords(s.seo.metaKeywords.join(", "));
        setOgImage(s.seo.ogImage);
        setSocial({
          ...emptySocial(),
          ...Object.fromEntries(s.socialLinks.map((l) => [l.platform, l.url])),
        });
      })
      .catch(() => {
        if (alive) setLoadError("Could not load the settings.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const errors = useMemo<Record<string, string>>(() => {
    const e: Record<string, string> = {};
    if (siteName.trim().length < 1) e.siteName = "Enter the website name";
    for (const p of SOCIAL_PLATFORMS) {
      const v = social[p].trim();
      if (v && !looksLikeUrl(v)) e[`social-${p}`] = "Enter a full URL starting with http";
    }
    return e;
  }, [siteName, social]);

  const tabErrorCount = (key: TabKey) =>
    Object.keys(errors).filter((f) => fieldTab(f) === key).length;

  function addEmail() {
    const parsed = emailSchema.safeParse(emailDraft);
    if (!parsed.success) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError(undefined);
    setNotificationEmails((prev) => (prev.includes(parsed.data) ? prev : [...prev, parsed.data]));
    setEmailDraft("");
  }

  function removeEmail(email: string) {
    setNotificationEmails((prev) => prev.filter((e) => e !== email));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      const bad = TABS.find((t) => tabErrorCount(t.key) > 0);
      if (bad) setTab(bad.key);
      return;
    }

    const body = {
      siteName: siteName.trim(),
      tagline: tagline.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      logoLight: logoLight ? { key: logoLight.key } : null,
      logoDark: logoDark ? { key: logoDark.key } : null,
      notificationEmails,
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaKeywords: splitKeywords(metaKeywords),
        ogImage: ogImage ? { key: ogImage.key } : null,
      },
      socialLinks: SOCIAL_PLATFORMS.filter((p) => social[p].trim()).map((p) => ({
        platform: p,
        url: social[p].trim(),
      })),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/v1/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<SettingsDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save the settings.");
        return;
      }
      setSaved(true);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <p className="border-coral/30 bg-coral/10 text-coral rounded-2xl border px-4 py-3 text-sm">
          {loadError}
        </p>
      </div>
    );
  }

  const siteNameError = submitted ? errors.siteName : undefined;
  const socialError = (p: SocialPlatform) => (submitted ? errors[`social-${p}`] : undefined);

  return (
    <div className="px-5 py-10 sm:px-8">

      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Site settings
      </h1>
      <p className="text-muted mt-2 text-sm">
        Branding, contact details, SEO and social links used across the site and in emails.
      </p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      {saved ? (
        <p className="border-brand/30 bg-brand-soft text-brand mt-5 rounded-2xl border px-4 py-3 text-sm">
          Settings saved.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6" noValidate>
        <div className="border-line flex gap-1 border-b">
          {TABS.map((t) => {
            const count = tabErrorCount(t.key);
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {count > 0 ? (
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[11px] tabular-nums ${
                      submitted ? "bg-coral/15 text-coral" : "bg-cream text-muted"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
                {t.label}
                {active ? (
                  <span className="bg-brand absolute inset-x-0 bottom-0 h-0.5 rounded-full" />
                ) : null}
              </button>
            );
          })}
        </div>

        <section className="bg-surface border-line shadow-soft mt-5 rounded-2xl border p-6 sm:p-7">
          {tab === "branding" ? (
            <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <h2 className="font-display text-ink text-lg font-semibold">Branding</h2>
                <p className="text-muted mt-0.5 text-sm">
                  The logo and name shown in the header and emails.
                </p>
              </div>

              <ImageField
                label="Logo — light background"
                hint="Shown on light surfaces (the header). SVG or PNG."
                value={logoLight}
                onChange={setLogoLight}
                aspect="aspect-[5/2]"
                contain
              />
              <ImageField
                label="Logo — dark background"
                hint="Shown on dark surfaces (the footer, dark emails)."
                value={logoDark}
                onChange={setLogoDark}
                aspect="aspect-[5/2]"
                contain
                dark
              />

              <AuthField
                label="Website name *"
                name="siteName"
                placeholder="Acme Careers"
                value={siteName}
                error={siteNameError}
                onChange={(e) => setSiteName(e.target.value)}
              />
              <AuthField
                label="Tagline"
                name="tagline"
                placeholder="Find your next role"
                maxLength={200}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
              <AuthField
                label="Contact email"
                name="contactEmail"
                type="email"
                placeholder="hello@acme.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <AuthField
                label="Contact phone"
                name="contactPhone"
                placeholder="+91 98765 43210"
                maxLength={30}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          ) : null}

          {tab === "notifications" ? (
            <div>
              <h2 className="font-display text-ink flex items-center gap-2 text-lg font-semibold">
                <Mail className="h-5 w-5" /> Notification emails
              </h2>
              <p className="text-muted mt-0.5 text-sm">
                Admin Emails that receive platform notifications. Add as many as you need.
              </p>

              <div className="mt-5 flex max-w-xl gap-2">
                <input
                  type="email"
                  value={emailDraft}
                  placeholder="alerts@acme.com"
                  onChange={(e) => {
                    setEmailDraft(e.target.value);
                    setEmailError(undefined);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addEmail}
                  className="bg-brand text-surface inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-4 text-sm font-semibold transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              {emailError ? <p className="text-coral mt-1.5 text-sm">{emailError}</p> : null}

              {notificationEmails.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {notificationEmails.map((email) => (
                    <li
                      key={email}
                      className="bg-cream text-ink inline-flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3 text-sm font-medium"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        aria-label={`Remove ${email}`}
                        className="text-muted hover:bg-surface hover:text-coral grid h-5 w-5 place-items-center rounded-full transition-colors"
                      >
                        <Close className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mt-3 text-xs">No notification emails added yet.</p>
              )}
            </div>
          ) : null}

          {tab === "seo" ? (
            <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <h2 className="font-display text-ink text-lg font-semibold">Default SEO</h2>
                <p className="text-muted mt-0.5 text-sm">
                  Fallback search-engine and social-preview data for pages without their own.
                </p>
              </div>

              <AuthField
                label="Meta title"
                name="metaTitle"
                placeholder="Acme Careers — jobs hiring now"
                maxLength={70}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
              <AuthField
                label="Meta keywords"
                name="metaKeywords"
                placeholder="jobs, careers, hiring"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
              />
              <label className="block lg:col-span-2">
                <span className="text-ink text-sm font-medium">Meta description</span>
                <textarea
                  name="metaDescription"
                  rows={3}
                  maxLength={160}
                  placeholder="Browse open roles across engineering, design and more."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className={`mt-2 resize-none ${inputClass}`}
                />
                <span className="text-muted mt-1 block text-xs tabular-nums">
                  {metaDescription.length}/160
                </span>
              </label>
              <div className="lg:col-span-2">
                <ImageField
                  label="Social share image (OG image)"
                  hint="Shown when a page is shared on social media. 1200×630 works best."
                  value={ogImage}
                  onChange={setOgImage}
                  aspect="aspect-[1200/630]"
                />
              </div>
            </div>
          ) : null}

          {tab === "social" ? (
            <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <h2 className="font-display text-ink text-lg font-semibold">Social links</h2>
                <p className="text-muted mt-0.5 text-sm">
                  Shown in the footer and emails. Leave a field blank to hide that icon.
                </p>
              </div>

              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = SOCIAL_ICONS[platform];
                return (
                  <SocialField
                    key={platform}
                    label={SOCIAL_PLATFORM_LABELS[platform]}
                    icon={<Icon className="h-4 w-4" />}
                    placeholder={SOCIAL_PLACEHOLDERS[platform]}
                    value={social[platform]}
                    error={socialError(platform)}
                    onChange={(value) => setSocial((prev) => ({ ...prev, [platform]: value }))}
                  />
                );
              })}
            </div>
          ) : null}
        </section>

        <div className="mt-6 flex items-center justify-end gap-3">
          {submitted && Object.keys(errors).length > 0 ? (
            <p className="text-coral mr-auto text-sm">
              {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} still
              need attention.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="bg-brand text-surface shadow-soft rounded-full px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SocialField({
  label,
  icon,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-ink text-sm font-medium">{label}</span>
      <div className="mt-2 flex">
        <span className="border-line bg-cream text-muted flex items-center rounded-l-2xl border border-r-0 px-3.5">
          {icon}
        </span>
        <input
          type="url"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`border-line bg-surface text-ink placeholder:text-muted/50 focus:border-brand focus:ring-brand/10 w-full rounded-r-2xl border px-4 py-3 transition-colors outline-none focus:ring-4 ${
            error ? "border-coral focus:border-coral focus:ring-coral/10" : ""
          }`}
        />
      </div>
      {error ? <p className="text-coral mt-1.5 text-sm">{error}</p> : null}
    </label>
  );
}
