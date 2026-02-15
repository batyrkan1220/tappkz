import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface PlatformPixels {
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
}

let platformPixelsInitialized = false;

export function usePlatformPixels() {
  const { data } = useQuery<PlatformPixels>({
    queryKey: ["/api/platform-pixels"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data || platformPixelsInitialized) return;
    const safeId = (v: string) => v.replace(/[^A-Za-z0-9_]/g, "");
    const fbId = data.facebookPixelId ? safeId(data.facebookPixelId) : "";
    const ttId = data.tiktokPixelId ? safeId(data.tiktokPixelId) : "";

    if (fbId.length === 0 && ttId.length === 0) return;
    platformPixelsInitialized = true;

    const w = window as any;

    if (fbId.length > 0 && !w.fbq) {
      const fbScript = document.createElement("script");
      fbScript.async = true;
      fbScript.src = "https://connect.facebook.net/en_US/fbevents.js";
      const n = w.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      w._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      document.head.appendChild(fbScript);
      w.fbq("init", fbId);
      w.fbq("track", "PageView");
    }

    if (ttId.length > 0 && (!w.ttq || !w.ttq.load)) {
      const ttScript = document.createElement("script");
      ttScript.id = "tt-pixel-platform";
      ttScript.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e+""]=+new Date;ttq._o=ttq._o||{};ttq._o[e+""]=n||{};var a=d.createElement("script");a.type="text/javascript";a.async=!0;a.src=r+"?sdkid="+e+"&lib="+t;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)}}(window,document,"ttq");`;
      document.head.appendChild(ttScript);
      w.ttq.load(ttId);
      w.ttq.page();
    }
  }, [data]);
}
