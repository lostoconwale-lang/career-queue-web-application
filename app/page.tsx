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

export default async function HomePage() {
  const [heroContent, howItWorksContent, categories] = await Promise.all([
    listPublicHero(),
    listPublicHowItWorks(),
    listPublicPopularCategories(),
  ]);

  return (
    <>
      <Nav />
      <main>
        <Hero content={heroContent} />
        <HowItWorks content={howItWorksContent} />
        <JobCategories categories={categories} />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
