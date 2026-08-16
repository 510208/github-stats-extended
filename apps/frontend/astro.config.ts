import path from "node:path";

import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, passthroughImageService } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";

/*
 * One app: Starlight serves the docs under `/frontend/docs`, and the card
 * wizard is a page of the same site at `/frontend`.
 */
export default defineConfig({
  site: "https://github-stats-extended.vercel.app",
  base: "/frontend",
  outDir: "./build",
  // One screenshot; not worth a native image dependency.
  image: { service: passthroughImageService() },
  integrations: [
    react(),
    starlight({
      title: "GitHub Stats Extended",
      description: "Dynamically generate GitHub stats for your READMEs.",
      logo: { src: "./src/assets/appLogo64.png", alt: "" },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/stats-organization/github-stats-extended",
        },
      ],
      // The docs link to each other by site path, so a rename must fail the build.
      plugins: [starlightLinksValidator()],
      customCss: ["./src/styles/starlight-theme.css"],
      components: { SiteTitle: "./src/components/SiteTitle.astro" },
      sidebar: [
        { label: "Overview", slug: "docs" },
        {
          label: "Advanced Customization",
          slug: "docs/advanced_documentation",
        },
        { label: "Available Themes", slug: "docs/themes" },
        { label: "Run It Yourself", slug: "docs/deploy" },
        { label: "Fork Information", slug: "docs/fork" },
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      conditions: ["@stats/source"],
      alias: [
        {
          find: "../fetchers/wakatime.js",
          replacement: path.resolve(
            import.meta.dirname,
            "src/wakatime-override.ts",
          ),
        },
      ],
    },
    // The backend code the wizard reuses imports `pg`, which never runs in the browser.
    build: {
      rollupOptions: {
        external: ["pg"],
      },
    },
  },
});
