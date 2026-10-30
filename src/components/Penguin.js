import Svg, { Circle, Ellipse, Path } from "react-native-svg";

const BLACK = "#111111";
const ORANGE = "#F59E0B";

// Mascotte de l'app (dessin maison) : un pingouin qui salue de l'aile gauche.
export default function Penguin({ size = 56 }) {
  return (
    <Svg width={size * 0.8} height={size} viewBox="0 0 48 60">
      {/* Aile levée, derrière le corps */}
      <Ellipse cx="9" cy="17" rx="4.5" ry="10" fill={BLACK} transform="rotate(-28 9 17)" />
      {/* Corps */}
      <Ellipse cx="26" cy="32" rx="15" ry="24" fill={BLACK} />
      {/* Visage en cœur et ventre blancs */}
      <Circle cx="21.5" cy="22" r="6.5" fill="#FFFFFF" />
      <Circle cx="30.5" cy="22" r="6.5" fill="#FFFFFF" />
      <Ellipse cx="26" cy="40" rx="11" ry="14" fill="#FFFFFF" />
      {/* Yeux avec reflet */}
      <Circle cx="22.5" cy="22" r="2.2" fill={BLACK} />
      <Circle cx="29.5" cy="22" r="2.2" fill={BLACK} />
      <Circle cx="23.2" cy="21.2" r="0.7" fill="#FFFFFF" />
      <Circle cx="30.2" cy="21.2" r="0.7" fill="#FFFFFF" />
      {/* Bec */}
      <Path d="M23 27 Q26 25.5 29 27 Q26 31 23 27 Z" fill={ORANGE} />
      {/* Aile baissée */}
      <Ellipse cx="40.5" cy="38" rx="3.5" ry="10" fill={BLACK} transform="rotate(-12 40.5 38)" />
      {/* Pattes */}
      <Ellipse cx="20" cy="56.5" rx="5.5" ry="2.8" fill={ORANGE} />
      <Ellipse cx="32" cy="56.5" rx="5.5" ry="2.8" fill={ORANGE} />
    </Svg>
  );
}
