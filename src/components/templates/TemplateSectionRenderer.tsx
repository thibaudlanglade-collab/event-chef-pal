import { TemplateSection } from "@/hooks/useCustomTemplates";
import TemplateFieldRenderer from "./TemplateFieldRenderer";

interface TemplateSectionRendererProps {
  section: TemplateSection;
  sectionIndex: number;
  isEditing: boolean;
  onFieldChange: (sectionIdx: number, fieldIdx: number, value: string) => void;
  onFieldValidate: (sectionIdx: number, fieldIdx: number) => void;
}

const TemplateSectionRenderer = ({
  section,
  sectionIndex,
  isEditing,
  onFieldChange,
  onFieldValidate,
}: TemplateSectionRendererProps) => {
  return (
    <section className="space-y-4">
      <h3 className="font-black text-sm uppercase text-slate-400 tracking-wide border-b pb-2 flex items-center gap-2">
        {section.titre}
      </h3>
      <div className="space-y-3">
        {section.champs.map((field, fieldIdx) => (
          <TemplateFieldRenderer
            key={field.id}
            field={field}
            isEditing={isEditing}
            onChange={(val) => onFieldChange(sectionIndex, fieldIdx, val)}
            onValidate={() => onFieldValidate(sectionIndex, fieldIdx)}
          />
        ))}
      </div>
    </section>
  );
};

export default TemplateSectionRenderer;
