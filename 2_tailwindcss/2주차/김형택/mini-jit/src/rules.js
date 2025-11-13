export const COLORS = {
    "red-500": "#ef4444",
    "blue-500": "#3b82f6",
    "green-500": "#10b981",
    "gray-700": "#374151"
};

export const RULES = {
    "text-center": "text-align: center;",
    "font-bold": "font-weight: 700;",
    "p-4": "padding: 1rem;",
    "m-4": "margin: 1rem;",
    "rounded": "border-radius: 0.25rem;"
};

export function generateRuleFor(token) {
    // bg-{color}
    if (token.startsWith("bg-")) {
        const colorKey = token.slice(3);
        const color = COLORS[colorKey];
        if (color) return `background-color: ${color};`;
    }
    // text-{color}
    if (token.startsWith("text-")) {
        const colorKey = token.slice(5);
        const color = COLORS[colorKey];
        if (color) return `color: ${color};`;
    }
    // p-1..p-6
    if (/^p-\d$/.test(token)) {
        const n = Number(token.split("-")[1]);
        const map = {1: "0.25rem", 2: "0.5rem", 3: "0.75rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem"};
        if (map[n]) return `padding: ${map[n]};`;
    }
    // fallback predefined rules
    if (RULES[token]) return RULES[token];
    return null;
}
