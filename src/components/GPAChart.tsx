import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useThemeColors, type ThemeColors } from '../theme';
import { fonts } from '../theme/fonts';

type Props = {
  data: number[];
  maxValue: number;
  width: number;
  height?: number;
};

export default function GPAChart({ data, maxValue, width, height = 180 }: Props) {
  const colors = useThemeColors();

  const paddingTop = 20;
  const paddingBottom = 28;
  const paddingLeft = 36;
  const paddingRight = 16;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const gridLines = 4;

  const getX = (i: number) => {
    if (data.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (i / (data.length - 1)) * chartW;
  };
  const getY = (v: number) => paddingTop + chartH - (v / maxValue) * chartH;

  const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Horizontal grid lines + labels */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const val = (maxValue / gridLines) * i;
          const y = getY(val);
          return (
            <React.Fragment key={i}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={colors.textSecondary}
              >
                {val.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Line */}
        {data.length > 1 && (
          <Polyline
            points={points}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Dots + value labels */}
        {data.map((v, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={getX(i)}
              cy={getY(v)}
              r={5}
              fill={colors.primary}
              stroke={colors.surface}
              strokeWidth={2}
            />
            <SvgText
              x={getX(i)}
              y={getY(v) - 10}
              textAnchor="middle"
              fontSize={10}
              fontWeight="600"
              fill={colors.text}
            >
              {v.toFixed(2)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Bottom labels */}
        {data.map((_, i) => (
          <SvgText
            key={i}
            x={getX(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize={10}
            fill={colors.textSecondary}
          >
            {i + 1}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
