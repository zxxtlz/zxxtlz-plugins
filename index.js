// Revenge/Vendetta expose these as globals at runtime
const { findByProps } = vendetta.metro;
const { after } = vendetta.patcher;

function removeRadius(style) {
    if (!style) return;
    if (Array.isArray(style)) {
        style.forEach(removeRadius);
        return;
    }
    if (typeof style !== "object") return;

    if ("borderRadius" in style) style.borderRadius = 0;

    for (const corner of [
        "borderTopLeftRadius",
        "borderTopRightRadius",
        "borderBottomLeftRadius",
        "borderBottomRightRadius",
    ]) {
        if (corner in style) style[corner] = 0;
    }

    if (style.style) removeRadius(style.style);
}

const patches = [];

// --- React.createElement global hook ---
// Catches almost everything rendered in Discord
const React = findByProps("createElement", "Component");
if (React) {
    patches.push(
        after("createElement", React, (_args, res) => {
            try {
                if (res?.props?.style) removeRadius(res.props.style);
            } catch (_) {}
            return res;
        })
    );
}

// --- Avatar (user profile pictures) ---
const AvatarModule = findByProps("AvatarWithPresence") 
    ?? findByProps("Avatar", "getAvatarSource");
if (AvatarModule) {
    const key = AvatarModule.AvatarWithPresence ? "AvatarWithPresence" : "Avatar";
    patches.push(
        after(key, AvatarModule, (_args, res) => {
            if (res?.props?.style) removeRadius(res.props.style);
            return res;
        })
    );
}

// --- Guild/Server icons ---
const GuildIconModule = findByProps("GuildIcon");
if (GuildIconModule) {
    patches.push(
        after("GuildIcon", GuildIconModule, (_args, res) => {
            if (res?.props?.style) removeRadius(res.props.style);
            return res;
        })
    );
}

// --- Buttons ---
const ButtonModule = findByProps("Button", "ButtonColors");
if (ButtonModule) {
    patches.push(
        after("Button", ButtonModule, (_args, res) => {
            if (res?.props?.style) removeRadius(res.props.style);
            return res;
        })
    );
}

// --- Cleanup ---
export function onUnload() {
    patches.forEach(p => p?.());
}