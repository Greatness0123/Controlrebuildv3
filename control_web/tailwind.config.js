/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                walter: ['"Walter Turncoat"', 'cursive'],
            },
            colors: {
                border: "var(--border-primary)",
                input: "var(--border-primary)",
                ring: "var(--accent-primary)",
                background: "var(--bg-primary)",
                foreground: "var(--text-primary)",
                primary: {
                    DEFAULT: "var(--accent-primary)",
                    foreground: "var(--accent-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--bg-secondary)",
                    foreground: "var(--text-secondary)",
                },
                destructive: {
                    DEFAULT: "#ef4444",
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "var(--bg-tertiary)",
                    foreground: "var(--text-muted)",
                },
                accent: {
                    DEFAULT: "var(--bg-card)",
                    foreground: "var(--text-primary)",
                },
                popover: {
                    DEFAULT: "var(--bg-card)",
                    foreground: "var(--text-primary)",
                },
                card: {
                    DEFAULT: "var(--bg-card)",
                    foreground: "var(--text-primary)",
                },
                // Theme-aware custom palette
                "card-hover": "var(--bg-card-hover)",
                "accent-primary": "var(--accent-primary)",
                "accent-foreground": "var(--accent-foreground)",
                "text-muted": "var(--text-muted)",
                "text-secondary": "var(--text-secondary)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("@tailwindcss/typography")],
}