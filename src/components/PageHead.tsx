import { useEffect } from "react";

type PageHeadProps = {
  title: string;
  canonical: string;
};

const PageHead = ({ title, canonical }: PageHeadProps) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const created = !link;
    const previousHref = link?.getAttribute("href");

    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    return () => {
      document.title = previousTitle;
      if (!link) return;
      if (created) {
        link.remove();
        return;
      }
      if (previousHref) {
        link.setAttribute("href", previousHref);
      }
    };
  }, [title, canonical]);

  return null;
};

export default PageHead;
