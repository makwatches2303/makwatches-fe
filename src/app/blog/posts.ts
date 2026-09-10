export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

// Static placeholder content -- there is no blog CMS behind this yet. When
// one exists, this file becomes the one place a fetch call replaces a
// constant; nothing else in this route should need to change.
export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "The Art of Watchmaking: Traditional Craftsmanship Meets Modern Innovation",
    excerpt:
      "Explore how traditional watchmaking techniques blend with contemporary technology to create timepieces that honor the past while embracing the future.",
    date: "Oct 5, 2024",
    category: "Craftsmanship",
    readTime: "5 min read",
    image: "/luxury watch.png",
    featured: true,
  },
  {
    id: 2,
    title: "Choosing the Perfect Watch for Your Lifestyle",
    excerpt:
      "A comprehensive guide to selecting a timepiece that complements your daily activities, professional needs, and personal style preferences.",
    date: "Oct 1, 2024",
    category: "Lifestyle",
    readTime: "7 min read",
    image: "/header-watch.png",
  },
  {
    id: 3,
    title: "Understanding Watch Movements: Mechanical vs Quartz",
    excerpt:
      "Dive deep into the heart of timepieces and understand the fundamental differences between mechanical and quartz movements.",
    date: "Sep 28, 2024",
    category: "Education",
    readTime: "6 min read",
    image: "/hero-watch.png",
  },
  {
    id: 4,
    title: "Caring for Your Luxury Timepiece: Maintenance Tips",
    excerpt:
      "Learn essential maintenance practices to keep your watch in pristine condition and ensure its longevity for generations to come.",
    date: "Sep 25, 2024",
    category: "Care",
    readTime: "4 min read",
    image: "/watch2.png",
  },
  {
    id: 5,
    title: "Investment Grade Watches: Building Your Collection",
    excerpt:
      "Learn which timepieces hold their value and how to build a watch collection that serves as both passion and investment.",
    date: "Sep 20, 2024",
    category: "Investment",
    readTime: "8 min read",
    image: "/women-watch.png",
  },
  {
    id: 6,
    title: "The Evolution of Luxury Timepieces",
    excerpt:
      "Discover how luxury watches have revolutionized over the decades and what makes them timeless investments.",
    date: "Sep 15, 2024",
    category: "History",
    readTime: "6 min read",
    image: "/Item-card-image-1.png",
  },
];

export const BLOG_CATEGORIES = [
  "All",
  "Craftsmanship",
  "Lifestyle",
  "Education",
  "Care",
  "Investment",
  "History",
] as const;
