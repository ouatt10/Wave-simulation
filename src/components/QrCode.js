import QRCode from "qrcode/lib/core/qrcode";
import { useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";

import { colors } from "@/constants/theme";

const MARGIN = 2; // marge blanche autour du code, en modules

/**
 * Code QR dessiné en SVG : la bibliothèque `qrcode` calcule la grille de
 * modules (noir / blanc), on la transforme en un seul chemin.
 */
export default function QrCode({ value, size = 160 }) {
  const { path, count } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
    let d = "";
    for (let row = 0; row < modules.size; row += 1) {
      for (let col = 0; col < modules.size; col += 1) {
        if (modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { path: d, count: modules.size };
  }, [value]);

  const box = count + MARGIN * 2;
  return (
    <Svg width={size} height={size} viewBox={`${-MARGIN} ${-MARGIN} ${box} ${box}`}>
      <Rect x={-MARGIN} y={-MARGIN} width={box} height={box} fill={colors.white} />
      <Path d={path} fill={colors.text} />
    </Svg>
  );
}
