"use client";

import { Quote, Star } from "lucide-react";

interface TestimonialMiniProps {
  content: string;
  authorName: string;
  rating?: number;
}

export function TestimonialMini({ content, authorName, rating }: TestimonialMiniProps) {
  // Truncate content to ~80 chars
  const truncated =
    content.length > 80 ? content.slice(0, 80).trim() + "..." : content;

  return (
    <div className="mt-3 rounded-md bg-muted/50 p-2">
      <div className="flex items-start gap-2">
        <Quote className="h-3 w-3 shrink-0 text-muted-foreground/50 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncated}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              — {authorName}
            </span>
            {rating && (
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-2.5 w-2.5 ${
                      i <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
