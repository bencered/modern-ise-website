"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
  content: string;
  authorName: string;
  rating?: number;
  residencyYear?: string;
  isFeatured?: boolean;
  createdAt: number;
}

export function TestimonialCard({
  content,
  authorName,
  rating,
  residencyYear,
  isFeatured,
  createdAt,
}: TestimonialCardProps) {
  return (
    <Card className={`${isFeatured ? "border-green-500/50 bg-green-500/5" : ""}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Quote className="h-8 w-8 shrink-0 text-muted-foreground/30" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-foreground">
              {content}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{authorName}</span>
              {residencyYear && (
                <Badge variant="secondary" className="text-xs">
                  {residencyYear}
                </Badge>
              )}
              {isFeatured && (
                <Badge className="bg-green-500 text-white">Featured</Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              {rating && (
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(createdAt).toLocaleDateString("en-IE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
