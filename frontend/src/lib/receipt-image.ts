/* ─── Receipt photos, ready to upload ─────────────────────────────────────────
   Phone photos are 3–8 MB and iPhones may hand over HEIC. Redrawing the photo
   onto a canvas and saving a JPEG (longest side 2000px) gives a ~300–600 KB
   file the server and the AI reader both accept, and uploads quickly on
   mobile data. PDFs pass through untouched. If the browser cannot decode the
   image, the original goes up and the server says if it can't take it.   */

export async function prepareReceipt(file: File, maxSide = 2000): Promise<File> {
  if (file.type === "application/pdf") return file;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return file;
    const base = (file.name || "receipt").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
