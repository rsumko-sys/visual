import React, { useState } from 'react';
import { Box, Slider, TextField, Typography } from '@mui/material';

const TEAL = '#2dd4bf';
const SLATE_700 = '#334155';
const SLATE_800 = '#1e293b';
const SLATE_900 = '#0f172a';

interface PolishedSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  snapPoints?: number[];
}

export default function PolishedSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
  snapPoints = [],
}: PolishedSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const valuePercent = ((value - min) / (max - min)) * 100;

  const SNAP_THRESHOLD = 0.05;
  const range = max - min;

  const snapToNearest = (val: number): number => {
    if (snapPoints.length === 0) return val;
    for (const point of snapPoints) {
      if (Math.abs(val - point) <= range * SNAP_THRESHOLD) return point;
    }
    return snapPoints.reduce((a, b) => (Math.abs(val - b) < Math.abs(val - a) ? b : a));
  };

  const handleSliderChange = (_: unknown, v: number | number[]) => {
    const val = Array.isArray(v) ? v[0] : v;
    onChange(snapToNearest(val));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) {
      const clamped = Math.min(max, Math.max(min, v));
      onChange(snapToNearest(clamped));
    }
  };

  const tickValues = snapPoints.length >= 3
    ? snapPoints
    : Array.from({ length: 5 }, (_, i) => min + (i / 4) * range);

  return (
    <Box sx={{ mb: 2 }}>
      {/* Single row: label | slider | input */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: 2,
            color: '#94a3b8',
            width: 96,
            flexShrink: 0,
            fontSize: 11,
          }}
        >
          {label}
        </Typography>
        <Box sx={{ flex: 1, position: 'relative', px: 0.5 }}>
          {/* Custom tooltip during drag */}
          {isDragging && (
            <Box
              sx={{
                position: 'absolute',
                left: `${valuePercent}%`,
                transform: 'translate(-50%, -28px)',
                px: 1,
                py: 0.25,
                bgcolor: SLATE_900,
                border: `1px solid ${TEAL}`,
                borderRadius: 1,
                color: TEAL,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                zIndex: 10,
                boxShadow: `0 0 8px rgba(45, 212, 191, 0.3)`,
              }}
            >
              {value}{unit}
            </Box>
          )}
          <Slider
            value={value}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            min={min}
            max={max}
            step={step}
            valueLabelDisplay={isDragging ? 'off' : 'auto'}
            valueLabelFormat={(v) => `${v}${unit}`}
            sx={{
              color: TEAL,
              height: 6,
              cursor: 'grab',
              '&.MuiSlider-dragging': { cursor: 'grabbing' },
              '& .MuiSlider-rail': {
                backgroundColor: SLATE_800,
                opacity: 1,
                transition: 'opacity 0.2s',
              },
              '& .MuiSlider-track': {
                backgroundColor: TEAL,
                border: 'none',
                transition: 'width 0.2s',
              },
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
                backgroundColor: TEAL,
                boxShadow: `0 0 8px ${TEAL}, 0 0 12px rgba(45, 212, 191, 0.4)`,
                border: '2px solid #0f172a',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'grab',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0 0 12px ${TEAL}`,
                  transform: 'scale(1.1)',
                },
                '&.Mui-active': {
                  boxShadow: `0 0 14px ${TEAL}`,
                  cursor: 'grabbing',
                },
              },
              '&:hover .MuiSlider-rail': {
                opacity: 1,
              },
              '& .MuiSlider-valueLabel': {
                backgroundColor: SLATE_900,
                border: `1px solid ${TEAL}`,
                color: TEAL,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'monospace',
              },
            }}
          />
        </Box>
        <TextField
          type="number"
          size="small"
          value={value}
          onChange={handleInputChange}
          inputProps={{
            min,
            max,
            step,
            style: { textAlign: 'right', width: 48, fontSize: 12 },
          }}
          sx={{
            width: 64,
            '& .MuiInputBase-root': { color: TEAL },
            '& .MuiOutlinedInput-root': {
              bgcolor: SLATE_900,
              '& fieldset': { borderColor: SLATE_700 },
              '&:hover fieldset': { borderColor: TEAL },
              '&.Mui-focused fieldset': { borderColor: TEAL },
            },
            '& input': { fontFamily: 'monospace', fontSize: 12, py: 0.5, px: 1 },
          }}
        />
      </Box>
      {/* Tick scale: snap points in white, others in gray */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5, mt: 0.5 }}>
        {tickValues.map((tickVal, i) => {
          const isSnapPoint = snapPoints.some((p) => Math.abs(tickVal - p) < step * 0.5);
          return (
            <Box
              key={i}
              sx={{
                width: 2,
                height: 6,
                bgcolor: isSnapPoint ? '#fff' : SLATE_700,
                borderRadius: 0.5,
                opacity: isSnapPoint ? 0.9 : 0.5,
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
