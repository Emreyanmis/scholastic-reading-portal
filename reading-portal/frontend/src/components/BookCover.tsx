// Renders a faux book cover from a base color. The cover shows the title and
// author on the front, with a subtle gradient + spine shadow so it looks like
// a stylized printed paperback. Used in the student dashboard, the teacher
// table, and the in-app reader header.

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const dims: Record<Size, { w: string; h: string; title: string; author: string }> = {
  xs: { w: "w-8",  h: "h-10", title: "text-[8px]",  author: "text-[7px]"  },
  sm: { w: "w-12", h: "h-16", title: "text-[10px]", author: "text-[8px]"  },
  md: { w: "w-16", h: "h-20", title: "text-[11px]", author: "text-[9px]"  },
  lg: { w: "w-24", h: "h-32", title: "text-sm",     author: "text-[10px]" },
  xl: { w: "w-full", h: "h-44", title: "text-lg",   author: "text-xs"     },
};

export function BookCover({
  title,
  author,
  color,
  size = "md",
  className = "",
}: {
  title: string;
  author?: string;
  color: string;
  size?: Size;
  className?: string;
}) {
  const d = dims[size];
  return (
    <div
      className={`book-cover ${d.w} ${d.h} ${className}`}
      style={{ background: color }}
      aria-hidden="true"
    >
      <div className={`book-cover-title ${d.title}`}>
        <div className="font-display font-semibold line-clamp-3 leading-tight">
          {title}
        </div>
        {author && size !== "xs" && size !== "sm" && (
          <div className={`mt-1 ${d.author} font-medium text-stone-700/80 line-clamp-1`}>
            {author}
          </div>
        )}
      </div>
    </div>
  );
}
