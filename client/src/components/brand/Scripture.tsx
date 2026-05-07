import { ReactNode } from "react";

export function Scripture({
  reference,
  children,
  align = "left",
  size = "md",
}: {
  reference?: string;
  children: ReactNode;
  align?: "left" | "center";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-xl md:text-2xl" : size === "sm" ? "text-base" : "text-lg md:text-xl";
  return (
    <figure className={align === "center" ? "text-center" : ""}>
      <blockquote
        className={`scripture scripture-bar ${sizeClass} text-foreground/90`}
      >
        “{children}”
      </blockquote>
      {reference ? (
        <figcaption className="mt-2 text-sm tracking-wide uppercase text-brand-gold font-sans font-medium">
          {reference}
        </figcaption>
      ) : null}
    </figure>
  );
}
