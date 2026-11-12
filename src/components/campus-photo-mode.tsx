"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { PHOTO_FORMATS, PHOTO_LIGHTS, type PhotoAdjustment, type PhotoCapture, type PhotoFormat, type PhotoLight } from "@/lib/campus-photo";
import { Icon } from "./icon";

type PhotoPreview = Omit<PhotoCapture, "blob"> & { url: string; filename: string };
const adjustments: Record<string, PhotoAdjustment> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
  "+": "in", "=": "in", "-": "out",
};

export function CampusPhotoMode({
  area, onClose, onLight, onFrame, onAdjust, onCapture,
}: {
  area: string;
  onClose: () => void;
  onLight: (light: PhotoLight) => void;
  onFrame: (wholeCampus: boolean) => void;
  onAdjust: (adjustment: PhotoAdjustment) => void;
  onCapture: (format: PhotoFormat) => Promise<PhotoCapture | null>;
}) {
  const [light, setLight] = useState<PhotoLight>("daylight");
  const [format, setFormat] = useState<PhotoFormat>("screen");
  const [wholeCampus, setWholeCampus] = useState(false);
  const [grid, setGrid] = useState(true);
  const [settings, setSettings] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PhotoPreview | null>(null);
  const mounted = useRef(false);
  const capturePending = useRef(false);
  const shutter = useRef<HTMLButtonElement>(null);
  const download = useRef<HTMLAnchorElement>(null);
  const ratio = PHOTO_FORMATS[format].ratio;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!preview) return;
    download.current?.focus();
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  async function takePhoto() {
    if (capturePending.current) return;
    capturePending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await onCapture(format);
      if (!result) throw new Error("Camera unavailable");
      if (!mounted.current) return;
      const time = new Date().toISOString().replace(/[:.]/g, "-");
      setPreview({
        url: URL.createObjectURL(result.blob),
        filename: `campusquest-${time}.png`,
        width: result.width,
        height: result.height,
      });
    } catch {
      if (mounted.current) {
        setError("Chưa chụp được ảnh. Thử lại hoặc quay về khuôn viên để tải lại cảnh.");
        requestAnimationFrame(() => shutter.current?.focus());
      }
    } finally {
      capturePending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function keydown(event: KeyboardEvent<HTMLElement>) {
    if (preview || busy || event.altKey || event.ctrlKey || event.metaKey || !Object.hasOwn(adjustments, event.key)) return;
    event.preventDefault();
    onAdjust(adjustments[event.key]);
  }

  function retake() {
    setPreview(null);
    requestAnimationFrame(() => shutter.current?.focus());
  }

  return (
    <section
      className={`campus-photo${preview ? " photo-review" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-title"
      onKeyDown={keydown}
    >
      <header className="photo-header">
        <div className="photo-heading">
          <span className="photo-emblem"><Icon name="camera" size={24} /></span>
          <div>
            <h2 id="photo-title">{preview ? "Ảnh vừa chụp" : "Máy ảnh"}</h2>
            <p>{preview ? `${preview.width} × ${preview.height} · PNG` : wholeCampus ? "Toàn trường" : area}</p>
          </div>
        </div>
        <div className="photo-actions">
          {!preview && <>
            <button className="hud-button" aria-label="Lưới căn ảnh" title="Lưới căn ảnh" aria-pressed={grid} onClick={() => setGrid(!grid)}><Icon name="grid" /></button>
            <button className="hud-button" aria-label="Cài đặt ảnh" title="Cài đặt ảnh" aria-expanded={settings} aria-controls="photo-controls" onClick={() => setSettings(!settings)}><Icon name="sliders" /></button>
          </>}
          <button className="hud-button" aria-label="Đóng máy ảnh" title="Đóng máy ảnh (Esc)" onClick={onClose}><Icon name="close" /></button>
        </div>
      </header>

      {preview ? (
        <>
          <div className="photo-print">
            <Image unoptimized src={preview.url} width={preview.width} height={preview.height} alt="Ảnh khuôn viên vừa chụp" />
          </div>
          <footer className="photo-review-actions">
            <button className="photo-retake" onClick={retake}><Icon name="reset" size={17} /> Chụp lại</button>
            <a className="primary-button" ref={download} href={preview.url} download={preview.filename}>
              Lưu ảnh PNG <Icon name="download" size={18} />
            </a>
          </footer>
        </>
      ) : (
        <>
          <div
            className="photo-viewfinder"
            data-crop={ratio !== null}
            data-grid={grid}
            style={ratio ? { "--photo-ratio": ratio } as CSSProperties : undefined}
            aria-hidden="true"
          >
            {grid && <span className="photo-thirds"><i /><i /><i /><i /></span>}
            <span className="photo-corners"><i /><i /><i /><i /></span>
          </div>

          <div className="photo-deck">
            {settings && (
              <div id="photo-controls" className="photo-controls">
                <div className="photo-control-row" role="group" aria-label="Ánh sáng">
                  <span aria-hidden="true">Ánh sáng</span>
                  <div className="photo-segments">
                    {(Object.keys(PHOTO_LIGHTS) as PhotoLight[]).map((look) => (
                      <button key={look} aria-pressed={light === look} onClick={() => { setLight(look); onLight(look); }}>
                        <i className={`photo-swatch swatch-${look}`} aria-hidden="true" />{PHOTO_LIGHTS[look].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="photo-control-row" role="group" aria-label="Tỷ lệ ảnh">
                  <span aria-hidden="true">Tỷ lệ ảnh</span>
                  <div className="photo-segments">
                    {(Object.keys(PHOTO_FORMATS) as PhotoFormat[]).map((option) => (
                      <button key={option} aria-pressed={format === option} onClick={() => setFormat(option)}>
                        {PHOTO_FORMATS[option].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="photo-control-row" role="group" aria-label="Góc máy">
                  <span aria-hidden="true">Góc máy</span>
                  <div className="photo-segments photo-framing">
                    <button aria-pressed={!wholeCampus} onClick={() => { setWholeCampus(false); onFrame(false); }}>Góc ban đầu</button>
                    <button aria-pressed={wholeCampus} onClick={() => { setWholeCampus(true); onFrame(true); }}>Toàn trường</button>
                    <button aria-label="Thu nhỏ góc máy" title="Thu nhỏ" onClick={() => onAdjust("out")}><Icon name="minus" size={16} /></button>
                    <button aria-label="Phóng to góc máy" title="Phóng to" onClick={() => onAdjust("in")}><Icon name="plus" size={16} /></button>
                  </div>
                </div>
              </div>
            )}
            <div className="photo-shutter-row">
              <div className="photo-hints">
                <p className="photo-mouse-hint">Kéo để xoay · Cuộn để thu phóng</p>
                <p className="photo-touch-hint">Vuốt để xoay · Chụm để thu phóng</p>
                <p className="photo-key-hint"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Xoay bằng bàn phím</p>
                <p className="photo-error" role="status">{error}</p>
              </div>
              <button className="primary-button photo-shutter" ref={shutter} onClick={takePhoto} disabled={busy}>
                <Icon name="camera" size={20} />{busy ? "Đang chụp…" : "Chụp ảnh"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
