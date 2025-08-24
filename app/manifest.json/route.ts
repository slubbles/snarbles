import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const manifest = {
    name: "Snarbles - AI-Powered Blockchain Analytics Platform",
    short_name: "Snarbles",
    description: "Professional blockchain analytics, AI-powered insights, and comprehensive tokenomics tools for DeFi, NFTs, and crypto projects.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    orientation: "portrait-primary",
    categories: ["finance", "business", "productivity", "utilities"],
    lang: "en-US",
    scope: "/",
    icons: [
      {
        src: "/favicon2.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/favicon2.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    shortcuts: [
      {
        name: "Analytics Dashboard",
        short_name: "Dashboard",
        description: "Access the analytics dashboard",
        url: "/dashboard",
        icons: [{ src: "/favicon2.png", sizes: "96x96" }]
      },
      {
        name: "Tokenomics Designer",
        short_name: "Tokenomics",
        description: "Design and simulate token economies",
        url: "/tokenomics",
        icons: [{ src: "/favicon2.png", sizes: "96x96" }]
      }
    ],
    screenshots: [
      {
        src: "/images/screenshot-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Snarbles Analytics Dashboard"
      },
      {
        src: "/images/screenshot-mobile.png", 
        sizes: "360x640",
        type: "image/png",
        form_factor: "narrow",
        label: "Snarbles Mobile Interface"
      }
    ],
    related_applications: [],
    prefer_related_applications: false,
    protocol_handlers: [
      {
        protocol: "web+snarbles",
        url: "/?handler=%s"
      }
    ],
    edge_side_panel: {
      preferred_width: 400
    }
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}
