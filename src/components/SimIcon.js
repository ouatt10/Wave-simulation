import Svg, { Path, Rect } from "react-native-svg";

// Petite carte SIM (coin coupé et puce), à côté du numéro sur l'accueil.
export default function SimIcon({ size = 16, color }) {
  return (
    <Svg width={size * 0.8} height={size} viewBox="0 0 16 20">
      <Path d="M2 0h8l6 6v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" fill={color} />
      <Rect x="4" y="9" width="8" height="7" rx="1" fill="#FFFFFF" />
      <Path d="M8 9v7M4 12.5h8" stroke={color} strokeWidth="1" />
    </Svg>
  );
}
