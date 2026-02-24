import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TemplateField } from "@/hooks/useCustomTemplates";

interface TemplateFieldRendererProps {
  field: TemplateField;
  isEditing: boolean;
  onChange: (value: string) => void;
  onValidate: () => void;
}

const TemplateFieldRenderer = ({ field, isEditing, onChange, onValidate }: TemplateFieldRendererProps) => {
  const isAuto = field.origin === "auto";
  const isEmpty = field.origin === "vide" && !field.value;

  const baseClasses = isAuto
    ? "border-purple-300 bg-purple-50/50 text-purple-900 focus:ring-purple-400"
    : "";

  if (isEditing) {
    const InputComp = field.type === "textarea" ? Textarea : Input;
    return (
      <div className="space-y-1">
        <label className="text-sm font-semibold text-foreground">{field.label}</label>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <InputComp
                value={field.value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.label}
                className={`${baseClasses} ${field.type === "textarea" ? "min-h-[80px]" : ""}`}
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              />
            </div>
          </TooltipTrigger>
          {isAuto && (
            <TooltipContent side="top" className="bg-purple-700 text-white">
              Suggestion IA — double-cliquez pour valider
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="space-y-1" onDoubleClick={isAuto ? onValidate : undefined}>
      <label className="text-xs font-bold uppercase tracking-wide text-slate-400">{field.label}</label>
      <Tooltip>
        <TooltipTrigger asChild>
          <p
            className={`text-base leading-relaxed whitespace-pre-line cursor-default ${
              isAuto ? "text-purple-700 border-l-2 border-purple-400 pl-3 bg-purple-50/30 rounded-r-lg py-1" : 
              isEmpty ? "text-muted-foreground italic" : "text-foreground"
            }`}
          >
            {field.value || (isEmpty ? `${field.label} — non renseigné` : field.value)}
          </p>
        </TooltipTrigger>
        {isAuto && (
          <TooltipContent side="top" className="bg-purple-700 text-white text-xs">
            ✨ Suggestion IA — double-cliquez pour valider
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
};

export default TemplateFieldRenderer;
