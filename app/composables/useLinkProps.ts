import { CtaBehavior, type Link } from "../../types";

// Props cho NuxtLink/<a> từ link đã chuẩn hoá của CMS: link ngoài giữ href +
// target, link nội bộ đi qua localePath (CMS chưa gắn page để trống "#" thì giữ
// nguyên, không ghép locale vào fragment). `newTab` áp dụng cho cả hai loại.
export function useLinkProps() {
  const localePath = useLocalePath();

  return (l: Link | null | undefined) => {
    const path = l?.to ?? "#";
    const newTab = l?.newTab
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};

    if (l?.type === CtaBehavior.EXTERNAL) {
      return { href: path, ...newTab };
    }

    return { to: path === "#" ? "#" : localePath(path), ...newTab };
  };
}
