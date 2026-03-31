import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const blogPosts = [
  {
    slug: "how-to-spot-fake-profiles-on-dating-sites",
    title: "How to Spot Fake Profiles on Dating Sites",
    excerpt:
      "Learn the telltale signs of fake profiles and how MyFilipinoMatch's verification system keeps you safe from scams and catfishing.",
    category: "Safety",
    author: "MyFilipinoMatch Team",
    date: "2026-03-28",
    readTime: "5 min read",
  },
  {
    slug: "tips-for-building-a-long-distance-relationship-with-a-filipina",
    title: "Tips for Building a Long-Distance Relationship with a Filipina",
    excerpt:
      "Practical advice on maintaining trust, communication, and connection when dating someone across the world.",
    category: "Dating Tips",
    author: "MyFilipinoMatch Team",
    date: "2026-03-20",
    readTime: "7 min read",
  },
  {
    slug: "understanding-filipino-culture-for-foreign-partners",
    title: "Understanding Filipino Culture for Foreign Partners",
    excerpt:
      "Family values, love languages, and cultural nuances every foreign partner should know before dating a Filipina.",
    category: "Culture",
    author: "MyFilipinoMatch Team",
    date: "2026-03-12",
    readTime: "6 min read",
  },
  {
    slug: "why-video-calls-build-trust-in-online-dating",
    title: "Why Video Calls Build Trust in Online Dating",
    excerpt:
      "Discover how seeing your match face-to-face — even virtually — creates deeper connections and reduces the risk of being scammed.",
    category: "Safety",
    author: "MyFilipinoMatch Team",
    date: "2026-03-05",
    readTime: "4 min read",
  },
  {
    slug: "first-trip-to-the-philippines-what-to-expect",
    title: "Your First Trip to the Philippines: What to Expect",
    excerpt:
      "A practical guide for foreign men visiting the Philippines for the first time to meet their Filipina match — from travel tips to cultural etiquette.",
    category: "Travel",
    author: "MyFilipinoMatch Team",
    date: "2026-02-25",
    readTime: "8 min read",
  },
  {
    slug: "signs-she-is-serious-about-a-relationship",
    title: "5 Signs She's Serious About a Relationship",
    excerpt:
      "Not sure if your match is looking for something real? Here are five green flags that show genuine relationship intent.",
    category: "Dating Tips",
    author: "MyFilipinoMatch Team",
    date: "2026-02-18",
    readTime: "5 min read",
  },
];

const categoryColors: Record<string, string> = {
  Safety: "bg-secondary/10 text-secondary border-secondary/20",
  "Dating Tips": "bg-primary/10 text-primary border-primary/20",
  Culture: "bg-accent/10 text-accent border-accent/20",
  Travel: "bg-muted text-muted-foreground border-border",
};

const Blog = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Blog — Dating Tips, Safety & Culture"
        description="Expert advice on international dating, Filipino culture, relationship tips, and online safety. Stay informed with the MyFilipinoMatch blog."
        canonical="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "MyFilipinoMatch Blog",
          description:
            "Expert advice on international dating, Filipino culture, relationship tips, and online safety.",
          url: "https://myfilipinomatch.lovable.app/blog",
          publisher: {
            "@type": "Organization",
            name: "MyFilipinoMatch",
            url: "https://myfilipinomatch.lovable.app",
          },
          blogPost: blogPosts.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            author: { "@type": "Organization", name: post.author },
            datePublished: post.date,
          })),
        }}
      />
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1
              className="text-3xl font-bold md:text-4xl mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Dating Tips, Safety & Culture
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Expert advice to help you navigate international dating, understand
              Filipino culture, and stay safe online.
            </p>
          </div>

          {/* Blog Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {blogPosts.map((post) => (
              <Card
                key={post.slug}
                className="border-border bg-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardContent className="p-6">
                  <Badge
                    variant="outline"
                    className={`mb-4 text-xs font-medium ${categoryColors[post.category] || ""}`}
                  >
                    {post.category}
                  </Badge>
                  <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center rounded-3xl gradient-hero p-10">
            <h2
              className="text-2xl font-bold text-primary-foreground mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ready to Find Your Match?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Join thousands of verified members looking for genuine connections.
            </p>
            <Link to="/signup">
              <Button
                variant="default"
                size="lg"
                className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold"
              >
                Create Free Account
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;
