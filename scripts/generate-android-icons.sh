#!/usr/bin/env bash
#
# Generates the legacy launcher PNGs (Android 7.x, API 24-25) from the same
# emerald + gold geometry as the vector adaptive icon. Android 8+ uses
# res/mipmap-anydpi-v26/ic_launcher.xml instead.
#
# Requires ImageMagick. Run from the repository root:
#   bash scripts/generate-android-icons.sh
set -euo pipefail
cd "$(dirname "$0")/.."

RES="android/app/src/main/res"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

GOLD='#D4AF37'
GOLD_LIGHT='#EFD894'

# --- geometry master (512x512) ------------------------------------------------
# Deep emerald gradient base, clipped to a rounded square.
convert -size 512x512 gradient:'#0F6B4F-#041F17' "$WORK/base.png"

convert -size 512x512 xc:black -fill white \
    -draw "roundrectangle 0,0 511,511 112,112" "$WORK/square-mask.png"

convert "$WORK/base.png" "$WORK/square-mask.png" \
    -alpha off -compose CopyOpacity -composite "$WORK/icon.png"

# Gold ring
convert "$WORK/icon.png" -fill none -stroke "$GOLD" -strokewidth 11 \
    -draw "circle 256,256 256,84" "$WORK/icon.png"

# Crescent drawn as one closed two-arc path: a wide outer arc and a slightly
# smaller inner arc leave a gold crescent that opens to the right.
convert "$WORK/icon.png" -fill "$GOLD" -stroke none \
    -draw "path 'M 250,120 A 138,138 0 1,0 250,392 A 143,143 0 0,1 250,120 Z'" \
    "$WORK/icon.png"

# Five-pointed star in the crescent opening
convert "$WORK/icon.png" -fill "$GOLD_LIGHT" -stroke none \
    -draw "polygon 352,138 359.6,157.5 380.5,158.7 364.4,172 369.6,192.3 352,181 334.4,192.3 339.6,172 323.5,158.7 344.4,157.5" \
    "$WORK/icon.png"

# Circular variant for launchers that request a round icon
convert -size 512x512 xc:black -fill white -draw "circle 256,256 256,0" "$WORK/round-mask.png"
convert "$WORK/icon.png" "$WORK/round-mask.png" \
    -alpha off -compose CopyOpacity -composite "$WORK/icon-round.png"

# --- density outputs ---------------------------------------------------------
emit() { # name source
    local name="$1" src="$2"
    for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
        local bucket="${d%%:*}" px="${d##*:}"
        mkdir -p "$RES/mipmap-$bucket"
        convert "$src" -filter Lanczos -resize "${px}x${px}" \
            -strip "PNG32:$RES/mipmap-$bucket/$name.png"
    done
}

emit ic_launcher "$WORK/icon.png"
emit ic_launcher_round "$WORK/icon-round.png"

# --- verification -----------------------------------------------------------
echo "Generated launcher PNGs:"
find "$RES" -name 'ic_launcher*.png' | sort | while read -r f; do
    printf '  %-58s %s\n' "$f" "$(identify -format '%wx%h %[colorspace]' "$f")"
done

echo "Crescent sample (gold in crescent body, emerald in the opening):"
convert "$WORK/icon.png" -format '  body=%[pixel:p{130,256}]  opening=%[pixel:p{330,256}]\n' info:
