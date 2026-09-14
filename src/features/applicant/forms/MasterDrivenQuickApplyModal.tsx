import React, { useMemo, useState } from "react";
import { ApplicantProfile, LabFacilitySelection, RequisitionRecord, RequisitionType } from "@/types";
import type { FacilityApiRecord } from "@/api/facilities.api";
import type { ServiceApiRecord } from "@/api/services.api";
import type { AccessFormConfig, AccessFormField } from "@/api/serviceFormConfig.types";
import { generateRequisitionId } from "@/lib/storage";
import { BadgeCheck, Building2, Check, Fingerprint, Info, Mail, Send, ShieldCheck, User, Wifi, X } from "lucide-react";

export type ServiceScope = "email" | "mac" | "hrms" | "lab" | "combined";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serviceScope: ServiceScope;
  mode: "new" | "renewal";
  applicantProfile: ApplicantProfile;
  existingRequisitions?: RequisitionRecord[];
  onSubmitRequisition: (requisition: RequisitionRecord) => void;
  service?: ServiceApiRecord;
  facility?: FacilityApiRecord;
}

const today = () => new Date().toISOString().slice(0, 10);

function fallbackConfig(scope: ServiceScope): AccessFormConfig {
  if (scope === "lab") {
    return { scope, fields: [
      { key: "purposeEquipment", label: "Purpose & Equipment / Instrument to be Used", type: "textarea", required: true, placeholder: "Specify research purpose, equipment/instrument and sample details." },
      { key: "fromDate", label: "Access Period - From Date", type: "date", required: true },
      { key: "toDate", label: "Access Period - To Date", type: "date", required: true },
      { key: "hasBiometricId", label: "Do you already have an assigned / registered Biometric ID?", type: "radio", required: true, options: [{ value: "yes", label: "Yes, I have a Biometric ID" }, { value: "no", label: "No, Biometric ID not created yet" }] },
      { key: "biometricIdNumber", label: "Existing Biometric ID Number", type: "text", required: true, visibleWhen: { field: "hasBiometricId", equals: "yes" } },
    ] };
  }
  return { scope, fields: [{ key: "requestDetails", label: "Request Details / Justification", type: "textarea", required: true }] };
}

function getIcon(scope: ServiceScope) {
  if (scope === "email") return Mail;
  if (scope === "mac") return Wifi;
  if (scope === "hrms") return Fingerprint;
  if (scope === "lab") return Building2;
  return ShieldCheck;
}

function initialValues(config: AccessFormConfig, profile: ApplicantProfile, mode: "new" | "renewal") {
  const values: Record<string, unknown> = {};
  for (const field of config.fields || []) {
    if (field.key === "requestedEmailPrefix") values[field.key] = profile.applicantName.toLowerCase().trim().replace(/\s+/g, ".");
    else if (field.key === "requestedEmailGroups") values[field.key] = [];
    else if (field.key === "deviceType") values[field.key] = field.options?.[0]?.value || "";
    else if (field.key === "hasBiometricId") values[field.key] = profile.biometricId ? "yes" : "no";
    else if (field.key === "biometricIdNumber") values[field.key] = profile.biometricId || "";
    else if (field.key === "fromDate") values[field.key] = today();
    else if (field.key === "toDate") values[field.key] = "";
    else if (field.type === "checkbox") values[field.key] = false;
    else values[field.key] = "";
  }
  if (mode === "renewal") values.renewalReason = "";
  return values;
}

function isVisible(field: AccessFormField, values: Record<string, unknown>) {
  if (!field.visibleWhen) return true;
  return values[field.visibleWhen.field] === field.visibleWhen.equals;
}

function renderField(field: AccessFormField, value: unknown, setValue: (value: unknown) => void) {
  const base = "w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800";
  if (field.type === "textarea") return <textarea rows={3} value={String(value || "")} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder} className={base} required={field.required} />;
  if (field.type === "select") return <select value={String(value || "")} onChange={(e) => setValue(e.target.value)} className={base} required={field.required}><option value="">Select</option>{(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  if (field.type === "date") return <input type="date" value={String(value || "")} onChange={(e) => setValue(e.target.value)} className={base} required={field.required} />;
  if (field.type === "checkbox") return <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold"><input type="checkbox" checked={Boolean(value)} onChange={(e) => setValue(e.target.checked)} className="w-4 h-4" />{field.label}</label>;
  if (field.type === "radio") return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{(field.options || []).map((option) => <label key={option.value} className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer ${value === option.value ? "bg-blue-50 border-blue-500 text-blue-900" : "bg-slate-50 border-slate-200 text-slate-700"}`}><input type="radio" checked={value === option.value} onChange={() => setValue(option.value)} className="mr-2" />{option.label}</label>)}</div>;
  if (field.type === "multiselect") return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{(field.options || []).map((option) => { const selected = Array.isArray(value) && value.includes(option.value); return <label key={option.value} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 text-xs"><input type="checkbox" checked={selected} onChange={() => { const current = Array.isArray(value) ? [...value] : []; setValue(selected ? current.filter((item) => item !== option.value) : [...current, option.value]); }} />{option.label}</label>; })}</div>;
  return <input type="text" value={String(value || "")} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder} className={base} required={field.required} />;
}

export const MasterDrivenQuickApplyModal: React.FC<Props> = ({ isOpen, onClose, serviceScope, mode, applicantProfile, existingRequisitions = [], onSubmitRequisition, service, facility }) => {
  const config = service?.formConfig || facility?.formConfig || fallbackConfig(serviceScope);
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(config, applicantProfile, mode));
  const [declarationAccepted, setDeclarationAccepted] = useState(true);
  const [signature, setSignature] = useState(applicantProfile.applicantName);
  const Icon = getIcon(serviceScope);

  const title = service?.name || facility?.name || "Access Application";
  const manager = service?.manager || facility?.nodal || applicantProfile.supervisingOfficerName;
  const visibleFields = useMemo(() => (config.fields || []).filter((field) => isVisible(field, values)), [config.fields, values]);

  if (!isOpen) return null;

  const setValue = (key: string, value: unknown) => setValues((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!declarationAccepted) return;

    const type: RequisitionType = serviceScope === "lab" ? "LAB_FACILITY" : serviceScope === "combined" ? "COMBINED" : "IT_HRMS";
    const formData = { ...values, requisitionMode: mode, renewalReason: values.renewalReason || undefined };
    const itHrmsDetails = serviceScope === "lab" ? undefined : {
      requisitionMode: mode,
      renewalReason: String(values.renewalReason || "") || undefined,
      requestEmail: serviceScope === "email" || serviceScope === "combined" || Boolean(values.requestedEmailPrefix),
      requestedEmailPrefix: values.requestedEmailPrefix ? String(values.requestedEmailPrefix) : undefined,
      requestedEmailGroups: Array.isArray(values.requestedEmailGroups) ? values.requestedEmailGroups.map(String) : undefined,
      requestInternet: serviceScope === "mac" || serviceScope === "combined" || Boolean(values.macAddress),
      deviceType: values.deviceType ? String(values.deviceType) : undefined,
      macAddress: values.macAddress ? String(values.macAddress).toUpperCase() : undefined,
      requestHrmsPms: serviceScope === "hrms" || serviceScope === "combined" || Boolean(values.requestHrmsPms),
      requestBiometric: serviceScope === "hrms" || serviceScope === "combined" || Boolean(values.requestBiometric),
      assignedBiometricId: values.biometricIdNumber ? String(values.biometricIdNumber) : applicantProfile.biometricId,
    };

    const labAccessDetails: LabFacilitySelection[] | undefined = serviceScope === "lab" && facility ? [{
      labId: facility.id,
      labName: facility.name,
      selected: true,
      purposeEquipment: String(values.purposeEquipment || ""),
      fromDate: String(values.fromDate || ""),
      toDate: String(values.toDate || ""),
      hasBiometricId: values.hasBiometricId === "yes",
      biometricIdNumber: values.biometricIdNumber ? String(values.biometricIdNumber) : undefined,
      nodalApprovalStatus: "pending",
      nodalOfficerName: facility.nodal || "",
    }] : undefined;

    const now = new Date().toISOString();
    const newId = generateRequisitionId(existingRequisitions);
    const newRequisition: RequisitionRecord = {
      id: newId,
      selectedServiceKey: service?.id || facility?.id,
      selectedRefId: service?.id || facility?.id,
      selectedServiceLabel: title,
      serviceName: title,
      formData,
      type,
      status: "submitted_pending_pi",
      createdAt: now,
      updatedAt: now,
      applicant: { ...applicantProfile },
      itHrmsDetails,
      labAccessDetails,
      history: [{
        id: `h_${Date.now()}`,
        actorRole: "applicant",
        actorName: applicantProfile.applicantName,
        actionType: "submit",
        comments: `Requisition submitted for ${title} (${mode.toUpperCase()} mode). Form data is sourced from the active master configuration. Manager/Nodal: ${manager}. FORM_DATA:${JSON.stringify(formData)}`,
        timestamp: now,
        digitalSignature: signature,
      }],
    };
    onSubmitRequisition(newRequisition);
    onClose();
  };

  return <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0"><div className="p-2 rounded-lg bg-blue-600 shrink-0"><Icon className="w-5 h-5" /></div><div className="min-w-0"><h3 className="text-sm font-extrabold truncate">{title}</h3><p className="text-[11px] text-slate-300">{mode === "renewal" ? "Renewal / Extension" : "Fresh Application"} • {service?.id || facility?.id || "Master"}</p></div></div>
        <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase"><span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-blue-600" /> Applicant Identity</span><span className="text-emerald-700 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Verified Profile</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><div className="text-[9px] font-bold text-slate-400 uppercase">Name & Designation</div><div className="font-extrabold">{applicantProfile.applicantName}</div><div className="text-slate-600">{applicantProfile.designation}</div><div className="text-[10px] mt-1">Valid Up To: <b>{applicantProfile.validUpTo}</b></div></div><div><div className="text-[9px] font-bold text-slate-400 uppercase">Project / Dept / Cell & Reporting Officer / PI</div><div className="font-semibold">{applicantProfile.departmentCellProject}</div><div className="font-extrabold text-blue-900">{applicantProfile.supervisingOfficerName}</div></div></div>
        </div>

        {mode === "renewal" && <div><label className="block text-xs font-bold mb-1">Reason for Access Extension / Renewal *</label><textarea required rows={2} value={String(values.renewalReason || "")} onChange={(e) => setValue("renewalReason", e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg" /></div>}

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-extrabold text-slate-900">{title}</h4><p className="text-[11px] text-slate-500">Form fields are loaded from the active Master record.</p></div><span className="text-[10px] font-bold text-slate-500">{service?.manager ? `Manager: ${service.manager}` : facility?.nodal ? `Nodal: ${facility.nodal}` : ""}</span></div>
          {visibleFields.map((field) => field.type === "checkbox" ? <div key={field.key}>{renderField(field, values[field.key], (value) => setValue(field.key, value))}</div> : <div key={field.key}><label className="block text-xs font-semibold text-slate-700 mb-1">{field.label}{field.required ? " *" : ""}</label>{renderField(field, values[field.key], (value) => setValue(field.key, value))}{field.helpText && <p className="text-[10px] text-slate-400 mt-1">{field.helpText}</p>}</div>)}
        </div>

        {serviceScope === "mac" && config.maxDevices !== undefined && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex gap-2"><Info className="w-4 h-4 text-amber-600 shrink-0" />Maximum concurrent device limit: <b>{config.maxDevices}</b> devices per user.</div>}

        {serviceScope === "lab" && facility && <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-900"><b>Facility:</b> {facility.name} • <b>Nodal:</b> {facility.nodal || "—"} • <b>Associate Nodal:</b> {facility.assocNodal || "—"}</div>}

        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3"><label className="flex items-start gap-2 text-xs leading-relaxed"><input type="checkbox" checked={declarationAccepted} onChange={(e) => setDeclarationAccepted(e.target.checked)} className="mt-0.5" />I hereby declare that the requested facilities/services will be utilized strictly for authorized WII research / official duties under the supervision of <b>{applicantProfile.supervisingOfficerName}</b>.</label><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Applicant Electronic Signature *</label><input required value={signature} onChange={(e) => setSignature(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div></div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200"><button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold">Cancel</button><button type="submit" disabled={!declarationAccepted} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Send className="w-4 h-4" /> Submit Access Request Now</button></div>
      </form>
    </div>
  </div>;
};
