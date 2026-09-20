import CTA from "./_components/CTA";
import FAQ from "./_components/FAQ";
import Footer from "./_components/Footer";
import Hero from "./_components/Hero";
import HowItWorks from "./_components/HowItWorks";
import JobCategories from "./_components/JobCategories";
import Nav from "./_components/Nav";
import Testimonials from "./_components/Testimonials";
import { auth } from "@/lib/auth/nextauth";
import { listPublicHeader } from "@/lib/services/public-header.service";
import { listPublicHero } from "@/lib/services/public-hero.service";
import { listPublicHowItWorks } from "@/lib/services/public-how-it-works.service";
import { listPublicPopularCategories } from "@/lib/services/public-popular-categories.service";
import { listPublicTestimonials } from "@/lib/services/public-testimonial.service";
import { listPublicSettings } from "@/lib/services/public-settings.service";

export default async function HomePage() {
  const [
    heroContent,
    howItWorksContent,
    popularCategoriesContent,
    testimonialsContent,
    settings,
    headerLinks,
    session,
  ] = await Promise.all([
    listPublicHero(),
    listPublicHowItWorks(),
    listPublicPopularCategories(),
    listPublicTestimonials(),
    listPublicSettings(),
    listPublicHeader(),
    auth(),
  ]);

  return (
    <>
      <Nav
        iconUrl={settings.iconLightUrl}
        siteName={settings.siteName}
        links={headerLinks}
        isAuthenticated={Boolean(session?.user)}
      />
      <main>
        <Hero content={heroContent} />
        <HowItWorks content={howItWorksContent} />
        <JobCategories content={popularCategoriesContent} />
        <Testimonials content={testimonialsContent} />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
