import React from 'react';
import { MessageSquareText, SearchCheck, FileSignature, CheckCircle } from 'lucide-react';

export interface StepItem {
  number: number;
  title: string;
  description: string;
  detail: string;
}

export const WORKFLOW_STEPS: StepItem[] = [
  {
    number: 1,
    title: "Cuéntenos su caso",
    description: "Escríbanos por WhatsApp o complete nuestro formulario con sus propias palabras, sin tecnicismos.",
    detail: "Adjunte cualquier papel, foto o colilla que tenga. Si prefiere conversar, puede solicitar una llamada en horario hábil.",
  },
  {
    number: 2,
    title: "Lo analizamos a fondo",
    description: "Revisamos los antecedentes, determinamos la institución responsable y las normas que la obligan a responder.",
    detail: "Identificamos si procede un derecho de petición (Art. 27), un recurso de amparo ante la Sala IV o un memorial administrativo.",
  },
  {
    number: 3,
    title: "Preparamos su documento",
    description: "Redactamos el escrito formal, técnico y fundamentado con los hechos, pruebas y petitoria exacta que exige la ley.",
    detail: "Le entregamos el archivo digital (PDF o Word) listo para presentar, junto con una guía clara de radicación.",
  },
  {
    number: 4,
    title: "Le damos seguimiento",
    description: "No lo dejamos solo. Le orientamos sobre los plazos que la entidad tiene para contestar y los pasos a seguir.",
    detail: "Si la institución no responde en el plazo de ley o responde con evasivas, le preparamos la siguiente acción legal.",
  },
];

export function StepCard({ step, compact = false }: { step: StepItem; compact?: boolean }) {
  const getIcon = (num: number) => {
    switch (num) {
      case 1:
        return <MessageSquareText className="w-5 h-5 text-azul-rey" />;
      case 2:
        return <SearchCheck className="w-5 h-5 text-azul-rey" />;
      case 3:
        return <FileSignature className="w-5 h-5 text-azul-rey" />;
      case 4:
      default:
        return <CheckCircle className="w-5 h-5 text-azul-rey" />;
    }
  };

  return (
    <div className="bg-slate-50/70 rounded-xl p-6 border border-slate-200/90 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Número e icono */}
        <div className="flex items-center justify-between">
          <span className="w-8 h-8 rounded-full bg-azul-rey text-white font-bold text-xs flex items-center justify-center">
            0{step.number}
          </span>
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
            {getIcon(step.number)}
          </div>
        </div>

        {/* Título */}
        <h3 className="text-base font-bold text-azul-rey">
          {step.title}
        </h3>

        {/* Resumen */}
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          {step.description}
        </p>
      </div>

      {/* Detalle ampliado */}
      {!compact && <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200/60 pt-3">
        {step.detail}
      </p>}
    </div>
  );
}
