import {
  Box,
  FileText,
  GlassWater,
  PackageOpen,
  Recycle,
  Trash2,
} from "lucide-react";
import type { ComponentType } from "react";
import { CATEGORY_INFO } from "@/lib/model-data";
import { SectionHeading } from "@/components/section-heading";

const categoryIcons: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  cardboard: PackageOpen,
  glass: GlassWater,
  metal: Box,
  paper: FileText,
  plastic: Recycle,
  trash: Trash2,
};

export function CategorySection() {
  return (
    <section className="section categories-section" id="categories">
      <div className="container">
        <SectionHeading
          eyebrow="Supported categories"
          title="Six material classes, clearly explained"
          description="The model can only choose from these six learned categories. Local collection rules still determine what belongs in your bin."
          align="center"
        />

        <div className="category-grid">
          {CATEGORY_INFO.map((category) => {
            const Icon = categoryIcons[category.class];
            return (
              <article className={`category-card category-card--${category.accent}`} key={category.class}>
                <div className="category-card__icon" aria-hidden="true">
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <span className="category-card__index">
                    {String(CATEGORY_INFO.indexOf(category) + 1).padStart(2, "0")}
                  </span>
                  <h3>{category.name}</h3>
                </div>
                <p>{category.shortDescription}</p>
                <div className="category-card__guidance">
                  <Recycle size={15} aria-hidden="true" />
                  <span>{category.guidance}</span>
                </div>
                <small>Always check local recycling rules.</small>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
