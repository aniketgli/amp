import { getEmploymentTypes, getOrgUnits, getBanks, getDesignations, getStreams, getMscBatches, getCourses, getTraineeBatches, getProfileOfficers, getBatchSeries, getBatches } from "../repositories/profile-master.repository";

const ORG_TYPES = new Set(["department", "cell", "project"]);
function optionalId(value: unknown, label: string): number | undefined { if(value===undefined||value===null||String(value).trim()==="") return undefined; const n=Number(value); if(!Number.isSafeInteger(n)||n<=0) throw new Error(`${label} must be a valid positive integer.`); return n; }
export const listEmploymentTypes=()=>getEmploymentTypes();
export async function listOrgUnits(requestedTypes?:unknown){if(requestedTypes===undefined)return getOrgUnits();if(!Array.isArray(requestedTypes))throw new Error("Invalid organization unit type selection.");const types=requestedTypes.map(String);if(types.some(t=>!ORG_TYPES.has(t)))throw new Error("Invalid organization unit type.");return getOrgUnits(types as any);}
export const listBanks=()=>getBanks();
export async function listDesignations(requestedEmploymentTypeId?:unknown){return getDesignations(optionalId(requestedEmploymentTypeId,"Employment Type"));}
export const listStreams=()=>getStreams();
export async function listMscBatches(requestedStreamId?:unknown){return getMscBatches(optionalId(requestedStreamId,"Stream"));}
export const listCourses=()=>getCourses();
export async function listTraineeBatches(requestedCourseId?:unknown){return getTraineeBatches(optionalId(requestedCourseId,"Course"));}
export const listProfileOfficers=()=>getProfileOfficers();
/* Legacy endpoints remain available during profile migration. */
export async function listBatchSeries(requestedSeriesType?:unknown){const value=requestedSeriesType==null?undefined:String(requestedSeriesType).trim()||undefined;if(value&&!new Set(["msc","diploma_trainee"]).has(value))throw new Error("Invalid batch series.");return getBatchSeries(value);}
export async function listBatches(requestedSeriesType?:unknown){const value=requestedSeriesType==null?undefined:String(requestedSeriesType).trim()||undefined;if(value&&!new Set(["msc","diploma_trainee"]).has(value))throw new Error("Invalid batch series.");return getBatches(value);}
