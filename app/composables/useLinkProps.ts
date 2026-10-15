import { LinkType, type Link } from "../../types";

// Props cho NuxtLink/<a> từ link đã chuẩn hoá của CMS: link ngoài giữ href +
// target, link nội bộ đi qua localePath (CMS chưa gắn page để trống "#" thì giữ
// nguyên, không ghép locale vào fragment).
export function useLinkProps() {
  const localePath = useLocalePath();

  return (l: Link | null | undefined) => {
    const path = l?.to ?? "#";

    if (l?.type === LinkType.EXTERNAL) {
      return {
        href: path,
        target: l.newTab ? "_blank" : undefined,
        rel: "noopener noreferrer",
      };
    }

    return { to: path === "#" ? "#" : localePath(path) };
  };
}
