import { Loader2 } from "lucide-react";
import React from "react";

export const ShadcnSpinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-4">
    <Loader2 className="animate-spin w-8 h-8 text-[#FD9555] mb-2" />
    {label && <span className="text-sm text-gray-700">{label}</span>}
  </div>
);

export default ShadcnSpinner;
