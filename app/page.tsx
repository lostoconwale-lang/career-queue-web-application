import CTA from "./_components/CTA";
import FAQ from "./_components/FAQ";
import Footer from "./_components/Footer";
import Hero from "./_components/Hero";
import HowItWorks from "./_components/HowItWorks";
import JobCategories from "./_components/JobCategories";
import Nav from "./_components/Nav";
import Testimonials from "./_components/Testimonials";
import { listPublicHero } from "@/lib/services/public-hero.service";
import { listPublicHowItWorks } from "@/lib/services/public-how-it-works.service";
import { listPublicPopularCategories } from "@/lib/services/public-popular-categories.service";
import { listPublicTestimonials } from "@/lib/services/public-testimonial.service";
import { listPublicSettings } from "@/lib/services/public-settings.service";

export default async function HomePage() {
  const [heroContent, howItWorksContent, popularCategoriesContent, testimonialsContent, settings] =
    await Promise.all([
      listPublicHero(),
      listPublicHowItWorks(),
      listPublicPopularCategories(),
      listPublicTestimonials(),
      listPublicSettings(),
    ]);

  return (
    <>
      <Nav iconUrl={settings.iconLightUrl} siteName={settings.siteName} />
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
