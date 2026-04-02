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
}: ProjectCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Screenshot or placeholder */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {hasScreenshot ? (
          <ScreenshotModal
            src={`/api/screenshots/${id}`}
            alt={`${githubName} screenshot`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-300">
              {getInitials(githubName)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{displayName || githubName}</h2>
          {stars > 0 && (
            <span className="text-sm text-gray-500 shrink-0" title="Stars">
              &#9733; {stars}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-2">
          {shortDesc.trim() || formatName(githubName)}
        </p>

        {longDesc && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-3">{longDesc}</p>
        )}

        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-100">
          {!isPrivate && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              GitHub
            </a>
          )}
          {productionUrl && (
            <a
              href={productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
