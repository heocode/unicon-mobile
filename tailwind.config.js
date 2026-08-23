const tokens = require("./src/theme/tokens.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: tokens.colors.background,
                foreground: tokens.colors.foreground,
                primary: tokens.colors.primary,
                "on-primary": tokens.colors.onPrimary,
                muted: tokens.colors.muted,
                "pagination-active": tokens.colors.paginationActive,
                "pagination-inactive": tokens.colors.paginationInactive,
                danger: tokens.colors.danger,
            },
            fontFamily: {
                medium: [tokens.fontFamily.medium],
                semibold: [tokens.fontFamily.semibold],
            },
        },
    },
    plugins: [],
};
