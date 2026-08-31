import ScreenshotModal from "./screenshot-modal";

interface ProjectCardProps {
  id: string;
  githubName: string;
  displayName: string | null;
  githubUrl: string;
  shortDesc: string;
  longDesc: string;
  productionUrl: string | null;
  isPrivate: boolean;
  stars: number;
  hasScreenshot: boolean;
  screenshotVersion: number;
}

function getInitials(name: string) {
  return name
    .replace(/[-_]/g, " ")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function formatName(name: string) {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProjectCard({
  id,
  githubName,
  displayName,
  githubUrl,
  shortDesc,
  longDesc,
  productionUrl,
  isPrivate,
  stars,
  hasScreenshot,
  screenshotVersion,
}: ProjectCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-accent/30 transition-all flex flex-col">
      {/* Screenshot or placeholder */}
      <div className="aspect-video bg-gradient-to-br from-primary/5 to-accent/10 relative overflow-hidden">
        {hasScreenshot ? (
          <ScreenshotModal
            src={`/api/screenshots/${id}?v=${screenshotVersion}`}
            alt={`${githubName} screenshot`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-accent/30">
              {getInitials(githubName)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h2 className="text-lg font-semibold text-primary mb-2">{displayName || githubName}</h2>

        <p className="text-sm text-secondary mb-2">
          {shortDesc.trim() || formatName(githubName)}
        </p>

        {longDesc && (
          <p className="text-sm text-muted mb-4 line-clamp-3">{longDesc}</p>
        )}

        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-100">
          {!isPrivate && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-secondary bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              GitHub
            </a>
          )}
          {productionUrl && (
            <a
              href={productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
            >
              Open
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
