import { AboutSection } from "@/components/about-section";
import { CategorySection } from "@/components/category-section";
import { ClassifierSection } from "@/components/classifier-section";
import { Hero } from "@/components/hero";
import { PerformanceSection } from "@/components/performance-section";
import { ProcessSection } from "@/components/process-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ClassifierSection />
        <CategorySection />
        <ProcessSection />
        <PerformanceSection />
        <AboutSection />
      </main>
      <SiteFooter />
    </>
  );
}

