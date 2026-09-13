import React from "react";
import { CheckCircle2, XCircle, Zap } from "lucide-react";

interface AccessOverrideSectionProps {
  requisitions: any[];
  handleForceApprove: (req: any) => void;
  handleForceReject: (req: any) => void;
}

export function AccessOverrideSection({
  requisitions,
  handleForceApprove,
  handleForceReject
}: AccessOverrideSectionProps) {
  return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-extrabold flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            Admin Master Approval Overrides
          </h2>

          <div className="space-y-3">
            {requisitions.map((req) => (
              <div
                key={req.id}
                className="border border-slate-200 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4"
              >
                <div>
                  <b>#{req.id}</b>

                  <div className="text-xs text-slate-500 mt-1">
                    {req.applicant?.applicantName || "Applicant"}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Status: {req.status}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleForceApprove(req)}
                    disabled={req.status === "approved_provisioned"}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:bg-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    Approve
                  </button>

                  <button
                    onClick={() => handleForceReject(req)}
                    disabled={req.status === "rejected"}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold disabled:bg-slate-300"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
  );
}
