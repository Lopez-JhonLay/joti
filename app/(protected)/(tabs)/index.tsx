import { AddEntryButton } from '@/components/ui/add-entry-button';
import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title="Home"
      description="Your recent accomplishments and unfinished drafts will appear here. This is a navigation preview."
    >
      <AddEntryButton />
    </PlaceholderScreen>
  );
}
