import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import camiguinIsland from "@/assets/camiguin-island.jpg";

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="About — Trusted Filipino Dating Site"
        description="MyFilipinoMatch was built to connect foreign men with genuine Filipina singles. Learn why we're the trusted, affordable alternative to other Filipino dating sites."
        canonical="/about"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About MyFilipinoMatch",
          description: "MyFilipinoMatch is a dating platform dedicated to fostering genuine, meaningful relationships between Filipinos and people from around the world.",
          url: "https://www.myfilipinomatch.com/about",
          mainEntity: {
            "@type": "Organization",
            name: "MyFilipinoMatch",
            url: "https://www.myfilipinomatch.com",
            description: "A trusted dating platform connecting foreigners with verified Filipino singles for serious relationships and marriage.",
            foundingDate: "2025",
          },
        }}
      />
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>About MyFilipinoMatch</h1>

          <figure className="mb-8 overflow-hidden rounded-2xl shadow-lg">
            <img
              src={camiguinIsland}
              alt="Aerial view of Camiguin Island in the Philippines with lush green volcanic peaks, white sand beaches, and turquoise waters"
              width={1600}
              height={1024}
              loading="lazy"
              className="w-full h-auto object-cover"
            />
            <figcaption className="text-xs text-muted-foreground mt-2 text-center italic">
              Camiguin Island, Philippines — where our story began.
            </figcaption>
          </figure>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-5 leading-relaxed">
            <p className="text-base text-foreground">
              MyFilipinoMatch was created from real conversations, real experiences, and a genuine desire to solve a common problem.
            </p>

            <p>
              Our journey began on the beautiful island of Camiguin in the Philippines — a place known not just for its scenery, but for the many foreigners who choose to settle there in search of a quieter, happier life. Many of them build meaningful relationships with Filipina partners and start a new chapter in life.
            </p>

            <p>
              As the owner of a restaurant and bar in this island, I've had the opportunity to meet and connect with countless travelers, retirees, and expats from around the world. Over time, a common story kept coming up.
            </p>

            <p>Again and again, I would hear the same stories.</p>

            <p>
              Men who had spent months talking to someone online…<br />
              Only to be disappointed when they finally met.
            </p>

            <p>
              Men who flew thousands of miles, full of hope…<br />
              Only to realize the connection wasn't real.
            </p>

            <p>
              Men who genuinely wanted something serious…<br />
              But kept running into people who didn't.
            </p>

            <p>
              There was frustration.<br />
              There was disappointment.<br />
              But more than anything — there was a desire for something real.
            </p>

            <p>And that stayed with me.</p>

            <p>
              Because on the other side, I also knew there are many Filipinas who are sincere, loyal, and genuinely looking for a meaningful relationship — but often get overlooked or lost in a sea of fake profiles and casual intentions.
            </p>

            <p className="text-foreground font-medium">That's when the idea for MyFilipinoMatch was born.</p>

            <p>
              A place built not from trends… but from real experiences.<br />
              A platform created with one simple purpose:
            </p>

            <p className="text-lg text-foreground font-semibold">
              To connect people who are serious about love.
            </p>

            <p>
              MyFilipinoMatch is designed to bring together foreigners and Filipinas who are looking for something genuine — not games, not temporary connections, but something lasting.
            </p>

            <p>
              A place where conversations mean something.<br />
              Where intentions are clear.<br />
              Where real connections can begin.
            </p>

            <p>Because we believe…</p>

            <p className="text-base text-foreground italic border-l-4 border-primary pl-4">
              The right connection doesn't just change your day — it can change your life.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
