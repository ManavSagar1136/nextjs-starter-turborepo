import Link from "next/link";
import { format } from "date-fns";
import { Calendar, FileText } from "lucide-react";

import { IDocPost } from "@/services/docs";
import { computeDocUrl } from "@/lib/docs/doc-url.service";
import { Card, CardContent, CardHeader } from "@buildbase/ui/components/ui/card";

const DocCard = ({ data }: { data: IDocPost | undefined }) => {
  if (!data) return null;

  const docUrl = data.url || computeDocUrl(data);

  return (
    <Link href={docUrl}>
      <div
        className="group h-full cursor-pointer mk-card mk-card-static hover:-translate-y-1 hover:shadow-[var(--mk-shadow-lg)] p-0"
        style={{ background: "var(--mk-bg-secondary)" }}
      >
        <div className="p-6 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: "var(--mk-text-muted)" }} />
              <h3 className="text-lg font-semibold transition-colors group-hover:text-[var(--mk-brand)]" style={{ color: "var(--mk-text-primary)" }}>{data.title}</h3>
            </div>
          </div>
          {data.subtitle && <p className="mt-1 text-sm" style={{ color: "var(--mk-text-secondary)" }}>{data.subtitle}</p>}
        </div>

        <div className="px-6 pb-6 pt-0">
          {data.description && <p className="mb-4 line-clamp-3 text-sm" style={{ color: "var(--mk-text-secondary)" }}>{data.description}</p>}

          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--mk-text-muted)" }}>
            <Calendar className="h-3 w-3" />
            <span>{data.publishedAt ? format(new Date(data.publishedAt), "MMM d, yyyy") : "No date"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DocCard;
