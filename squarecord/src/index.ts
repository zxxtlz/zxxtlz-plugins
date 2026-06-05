import { findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";

/**
 * Helper: force borderRadius = 0 in style objects
 */
function squashStyle(style: any) {
    if (!style) return;

    if (Array.isArray(style)) {
        style.forEach(squashStyle);
        return;
    }

    if (typeof style === "object") {
        if ("borderRadius" in style) {
            style.borderRadius = 0;
        }

        // Some Discord components use these too
        if ("borderTopLeftRadius" in style) {
            style.borderTopLeftRadius = 0;
            style.borderTopRightRadius = 0;
            style.borderBottomLeftRadius = 0;
            style.borderBottomRightRadius = 0;
        }
    }
}

/**
 * Patch React createElement so EVERYTHING loses rounding
 */
const React = findByProps("createElement");

const unpatchCreateElement = after("createElement", React, (args) => {
    const props = args[1];

    if (!props) return;

    if (props.style) {
        squashStyle(props.style);
    }
});

/**
 * Try to catch common Discord components directly
 */
const patches: any[] = [];

// Avatar / guild icon components (names vary by build, so we patch defensively)
const ImageComponents = findByProps("Avatar", "GuildIcon", "default");

if (ImageComponents?.Avatar) {
    patches.push(
        after("Avatar", ImageComponents, (args, res) => {
            if (res?.props?.style) squashStyle(res.props.style);
            return res;
        })
    );
}

if (ImageComponents?.GuildIcon) {
    patches.push(
        after("GuildIcon", ImageComponents, (args, res) => {
            if (res?.props?.style) squashStyle(res.props.style);
            return res;
        })
    );
}

/**
 * Export unload handler
 */
export const onUnload = () => {
    unpatchCreateElement();
    patches.forEach(p => p());
};