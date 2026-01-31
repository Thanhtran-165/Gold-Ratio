import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        border: "hsl(var(--border))",
      },
      backgroundImage: {
        'aurora': 'radial-gradient(ellipse at 50% 0%, rgba(76, 29, 149, 0.3), transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(14, 165, 233, 0.2), transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(236, 72, 153, 0.15), transparent 50%)',
      },
    },
  },
  plugins: [],
};
export default config;
