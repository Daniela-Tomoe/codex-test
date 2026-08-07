import type { ReactNode } from "react";

export type PlaceholderPageProps = {
  children?: ReactNode;
  description: string;
  title: string;
};

export function PlaceholderPage({ children, description, title }: PlaceholderPageProps) {
  return (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </main>
  );
}
