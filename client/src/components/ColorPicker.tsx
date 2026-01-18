import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#ef4444", "#f59e0b",
  "#8b5cf6", "#ec4899", "#f97316", "#06b6d4",
  "#84cc16", "#f43f5e", "#14b8a6", "#6366f1",
  "#a855f7", "#22c55e", "#eab308", "#0ea5e9",
  "#d946ef", "#64748b", "#78716c", "#000000",
];

export function ColorPicker({ value, onChange, label = "Cor" }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value || "#3b82f6");
  const [rgbInput, setRgbInput] = useState(() => hexToRgb(value || "#3b82f6"));

  useEffect(() => {
    setHexInput(value || "#3b82f6");
    setRgbInput(hexToRgb(value || "#3b82f6"));
  }, [value]);

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 59, g: 130, b: 246 };
  }

  function rgbToHex(r: number, g: number, b: number) {
    return "#" + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  const handleHexChange = (hex: string) => {
    const cleanHex = hex.startsWith("#") ? hex : "#" + hex;
    setHexInput(cleanHex);

    if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      onChange(cleanHex.toLowerCase());
      setRgbInput(hexToRgb(cleanHex));
    }
  };

  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const newRgb = { ...rgbInput, [channel]: Math.max(0, Math.min(255, val || 0)) };
    setRgbInput(newRgb);

    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(hex);
    onChange(hex);
  };

  const handlePresetClick = (color: string) => {
    setHexInput(color);
    setRgbInput(hexToRgb(color));
    onChange(color);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
          >
            <div
              className="w-6 h-6 rounded mr-2 border"
              style={{ backgroundColor: value || "#3b82f6" }}
            />
            {(value || "#3b82f6").toUpperCase()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <Tabs defaultValue="preset">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preset">Paleta</TabsTrigger>
              <TabsTrigger value="hex">HEX</TabsTrigger>
              <TabsTrigger value="rgb">RGB</TabsTrigger>
            </TabsList>

            {/* Preset Colors Tab */}
            <TabsContent value="preset" className="mt-4">
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded border-2 hover:scale-110 transition-transform ${
                      color === value ? "border-gray-900 dark:border-white ring-2 ring-offset-2" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handlePresetClick(color)}
                    title={color.toUpperCase()}
                  />
                ))}
              </div>
            </TabsContent>

            {/* HEX Tab */}
            <TabsContent value="hex" className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  onBlur={(e) => handleHexChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleHexChange(hexInput)}
                  placeholder="#3b82f6"
                  maxLength={7}
                  className="font-mono"
                />
                <div
                  className="w-12 h-10 rounded border flex-shrink-0"
                  style={{ backgroundColor: value || "#3b82f6" }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Seletor de cor</Label>
                <Input
                  type="color"
                  value={value || "#3b82f6"}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="w-full h-12 cursor-pointer p-1"
                />
              </div>
            </TabsContent>

            {/* RGB Tab */}
            <TabsContent value="rgb" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Red</Label>
                    <span className="text-xs text-muted-foreground">{rgbInput.r}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgbInput.r}
                      onChange={(e) => handleRgbChange("r", parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gradient-to-r from-black to-red-500 rounded-lg appearance-none cursor-pointer"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={rgbInput.r}
                      onChange={(e) => handleRgbChange("r", parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Green</Label>
                    <span className="text-xs text-muted-foreground">{rgbInput.g}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgbInput.g}
                      onChange={(e) => handleRgbChange("g", parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gradient-to-r from-black to-green-500 rounded-lg appearance-none cursor-pointer"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={rgbInput.g}
                      onChange={(e) => handleRgbChange("g", parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Blue</Label>
                    <span className="text-xs text-muted-foreground">{rgbInput.b}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgbInput.b}
                      onChange={(e) => handleRgbChange("b", parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gradient-to-r from-black to-blue-500 rounded-lg appearance-none cursor-pointer"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={rgbInput.b}
                      onChange={(e) => handleRgbChange("b", parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div
                  className="flex-1 h-10 rounded border"
                  style={{ backgroundColor: value || "#3b82f6" }}
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {(value || "#3b82f6").toUpperCase()}
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
