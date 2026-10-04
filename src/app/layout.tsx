import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site, basePath } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  openGraph: { title: site.ogTitle, description: site.ogDescription, type: "website", url: site.url, siteName: "Bimora" },
  twitter: { card: "summary", title: site.ogTitle, description: site.ogDescription },
  icons: { icon: `${basePath}/icon.svg` },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const face = (family: string, file: string, weight: string, range: string) =>
  `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:${weight};src:url(${basePath}/fonts/${file}) format('woff2-variations'),url(${basePath}/fonts/${file}) format('woff2');unicode-range:${range}}`;
const FONT_CSS = [
  face("Inter Variable", "inter-latin.woff2", "100 900", LATIN),
  face("Inter Variable", "inter-latin-ext.woff2", "100 900", LATIN_EXT),
  face("Newsreader Variable", "newsreader-latin.woff2", "200 800", LATIN),
  face("Newsreader Variable", "newsreader-latin-ext.woff2", "200 800", LATIN_EXT),
].join("");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preload" href={`${basePath}/fonts/newsreader-latin.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={`${basePath}/fonts/inter-latin.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
