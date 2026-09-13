import React from "react";
import { Sliders } from "lucide-react";

interface SystemMaintenanceSectionProps {
  systemConfig: any;
  setSystemConfig: React.Dispatch<React.SetStateAction<any>>;
}

export function SystemMaintenanceSection({
  systemConfig,
  setSystemConfig
}: SystemMaintenanceSectionProps) {
  return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-extrabold flex items-center gap-2 border-b border-slate-200 pb-3">
            <Sliders className="w-5 h-5 text-purple-600" />
            System Governance & Maintenance
          </h2>

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex justify-between items-center">
                <b className="text-sm">Maintenance Mode</b>

                <button
                  onClick={() =>
                    setSystemConfig((current) => ({
                      ...current,
                      maintenanceMode: !current.maintenanceMode,
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    systemConfig.maintenanceMode
                      ? "bg-red-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {systemConfig.maintenanceMode ? "ENABLED" : "DISABLED"}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                Maintenance mode can be used for system maintenance.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex justify-between items-center">
                <b className="text-sm">Emergency Approval</b>

                <button
                  onClick={() =>
                    setSystemConfig((current) => ({
                      ...current,
                      emergencyApprovalBypass: !current.emergencyApprovalBypass,
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    systemConfig.emergencyApprovalBypass
                      ? "bg-amber-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {systemConfig.emergencyApprovalBypass ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}
