import HeroSection from "../components/HeroSection";
import FeedSection from "../components/feed/FeedSection";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        className="min-h-[60vh] flex items-center justify-center text-sm text-gray-500"
      >
        Opening your workspace…
      </div>
    );
  }

  return user ? <FeedSection /> : <HeroSection />;
}