import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Path, Rect } from "react-native-svg";

const STEP = 90; // écart entre deux motifs
const RINGS = [36, 24, 12]; // demi-diagonales des losanges imbriqués

function diamond(cx, cy, r) {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

// Grille de losanges imbriqués, en quinconce, qui couvre width × height.
function pattern(width, height) {
  let d = "";
  for (let row = 0; row * (STEP / 2) <= height + STEP; row += 1) {
    const offset = row % 2 ? STEP / 2 : 0;
    for (let x = offset; x <= width + STEP; x += STEP) {
      RINGS.forEach((r) => (d += diamond(x, row * (STEP / 2), r)));
    }
  }
  return d;
}

/**
 * Fond de la carte QR, dessiné derrière son contenu.
 * Sur Android, `overflow: "hidden"` ne découpe pas un SVG selon les coins
 * arrondis : on dessine donc nous-mêmes le fond dans un rectangle arrondi.
 */
export default function CardPattern({ color, background, cornerRadius }) {
  const [size, setSize] = useState(null);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      pointerEvents="none"
    >
      {size && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <ClipPath id="card">
              <Rect width={size.width} height={size.height} rx={cornerRadius} />
            </ClipPath>
          </Defs>
          <Rect width={size.width} height={size.height} rx={cornerRadius} fill={background} />
          <Path
            d={pattern(size.width, size.height)}
            stroke={color}
            strokeWidth={5}
            fill="none"
            clipPath="url(#card)"
          />
        </Svg>
      )}
    </View>
  );
}
