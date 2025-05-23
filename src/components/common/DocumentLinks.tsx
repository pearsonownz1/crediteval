import React from "react";
import { supabase } from "../../lib/supabaseClient";

interface DocumentLinksProps {
  docPaths: string[] | null | undefined;
}

export const DocumentLinks: React.FC<DocumentLinksProps> = ({ docPaths }) => {
  if (!docPaths || docPaths.length === 0) {
    return <span className="text-xs text-gray-500">None</span>;
  }

  return (
    <ul className="list-none p-0 m-0 space-y-1">
      {docPaths.map((path, index) => {
        const filename = path.substring(path.lastIndexOf("/") + 1);
        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(path);
        const publicUrl = urlData?.publicUrl;

        if (!publicUrl) {
          return (
            <li
              key={index}
              className="text-xs text-red-500"
              title={`Could not get URL for ${path}`}>
              {decodeURIComponent(filename)} (Error)
            </li>
          );
        }

        return (
          <li key={index}>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs"
              download
              onClick={(e) => e.stopPropagation()}>
              {decodeURIComponent(filename)}
            </a>
          </li>
        );
      })}
    </ul>
  );
};
