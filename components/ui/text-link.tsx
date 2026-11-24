import { Link } from 'expo-router';
import type { LinkProps } from 'expo-router';

export function TextLink({ className = '', ...props }: LinkProps) {
  return (
    <Link
      className={`inline-link py-3 focus:text-foreground active:text-foreground ${className}`}
      {...props}
    />
  );
}
