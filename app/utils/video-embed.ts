// Chuyển URL xem video (YouTube watch/shorts/youtu.be, Vimeo) sang URL embed.
// Trả null cho protocol không phải http(s) để chặn javascript:/data: từ CMS.
export function toEmbedUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = url.pathname.match(/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  }

  return url.toString();
}
