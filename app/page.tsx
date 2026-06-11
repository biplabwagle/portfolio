import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { GlassFocusShowcase } from "@/components/GlassFocusShowcase";
import { Work } from "@/components/Work";
import { Approach } from "@/components/Approach";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Experience />
        <GlassFocusShowcase />
        <Work />
        <Approach />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
