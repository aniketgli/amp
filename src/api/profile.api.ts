import { apiRequest } from "./apiClient";
import type { ApplicantProfile, MasterStatus, ProfileBank, ProfileBatch, ProfileBatchSeries, ProfileBatchSeriesType, ProfileCourse, ProfileDesignation, ProfileEmploymentTypeMaster, ProfileMscBatch, ProfileOfficer, ProfileOrgUnit, ProfileOrgUnitType, ProfileStream, ProfileTraineeBatch } from "../types/profile";
export type { ApplicantProfile, ProfileBank, ProfileBatch, ProfileBatchSeriesType, ProfileEmploymentType, ProfileEmploymentTypeMaster, ProfileOfficer, ProfileOrgUnit, ProfileOrgUnitType } from "../types/profile";
interface ProfileResponse { success:boolean; message?:string; profile?:ApplicantProfile; }
interface MasterResponse<T> { success:boolean; message?:string; data?:T; }
interface PincodeResponse { success:boolean; message?:string; data?:{pincode:string;district:string;state:string}; }
export interface AdminProfileOrgUnit extends ProfileOrgUnit { status:MasterStatus; }
export interface AdminProfileBank extends ProfileBank { status:MasterStatus; }
export interface AdminProfileDesignation extends ProfileDesignation { status:MasterStatus; }
export interface AdminProfileStream extends ProfileStream { status:MasterStatus; }
export interface AdminProfileMscBatch extends ProfileMscBatch { status:MasterStatus; }
export interface AdminProfileCourse extends ProfileCourse { status:MasterStatus; }
export interface AdminProfileTraineeBatch extends ProfileTraineeBatch { status:MasterStatus; }
export interface ProfileOrgUnitAdminPayload { unitType:ProfileOrgUnitType; unitName:string; unitCode:string; description?:string|null; }
export interface ProfileBankAdminPayload { bankName:string; bankCode:string; }
export interface ProfileDesignationAdminPayload { employmentTypeId:number; designationName:string; designationCode:string; }
export interface ProfileStreamAdminPayload { streamName:string; streamCode:string; }
export interface ProfileMscBatchAdminPayload { streamId:number; batchNumber:number; batchName:string; batchCode:string; validityStartYear:number; validityEndYear:number; }
export interface ProfileCourseAdminPayload { courseName:string; courseCode:string; }
export interface ProfileTraineeBatchAdminPayload { courseId:number; batchNumber:number; batchName:string; batchCode:string; validityStartYear:number; validityEndYear:number; }
export async function getMyProfile(){const r=await apiRequest<ProfileResponse>("/api/profile",{method:"GET"});return r.profile??null;}
export async function updateMyProfile(profile:Record<string,unknown>){const r=await apiRequest<ProfileResponse>("/api/profile",{method:"PUT",body:JSON.stringify(profile)});if(!r.profile)throw new Error(r.message||"Profile update did not return the saved profile.");return r.profile;}
export async function getEmploymentTypes(){const r=await apiRequest<MasterResponse<ProfileEmploymentTypeMaster[]>>("/api/profile/masters/employment-types",{method:"GET"});return r.data??[];}
export async function getOrgUnits(types?:ProfileOrgUnitType[]){const endpoint=types?.length?`/api/profile/masters/org-units?${types.map(t=>`type=${encodeURIComponent(t)}`).join("&")}`:"/api/profile/masters/org-units";const r=await apiRequest<MasterResponse<ProfileOrgUnit[]>>(endpoint,{method:"GET"});return r.data??[];}
export async function getBanks(){const r=await apiRequest<MasterResponse<ProfileBank[]>>("/api/profile/masters/banks",{method:"GET"});return r.data??[];}
export async function getDesignations(employmentTypeId?:number){const endpoint=employmentTypeId?`/api/profile/masters/designations?employmentTypeId=${employmentTypeId}`:"/api/profile/masters/designations";const r=await apiRequest<MasterResponse<ProfileDesignation[]>>(endpoint,{method:"GET"});return r.data??[];}
export async function getStreams(){const r=await apiRequest<MasterResponse<ProfileStream[]>>("/api/profile/masters/streams",{method:"GET"});return r.data??[];}
export async function getMscBatches(streamId?:number){const endpoint=streamId?`/api/profile/masters/msc-batches?streamId=${streamId}`:"/api/profile/masters/msc-batches";const r=await apiRequest<MasterResponse<ProfileMscBatch[]>>(endpoint,{method:"GET"});return r.data??[];}
export async function getCourses(){const r=await apiRequest<MasterResponse<ProfileCourse[]>>("/api/profile/masters/courses",{method:"GET"});return r.data??[];}
export async function getTraineeBatches(courseId?:number){const endpoint=courseId?`/api/profile/masters/trainee-batches?courseId=${courseId}`:"/api/profile/masters/trainee-batches";const r=await apiRequest<MasterResponse<ProfileTraineeBatch[]>>(endpoint,{method:"GET"});return r.data??[];}
export async function getProfileOfficers(){const r=await apiRequest<MasterResponse<ProfileOfficer[]>>("/api/profile/masters/officers",{method:"GET"});return r.data??[];}
export async function getBatchSeries(seriesType?:ProfileBatchSeriesType){const endpoint=seriesType?`/api/profile/masters/batch-series?seriesType=${encodeURIComponent(seriesType)}`:"/api/profile/masters/batch-series";const r=await apiRequest<MasterResponse<ProfileBatchSeries[]>>(endpoint,{method:"GET"});return r.data??[];}
export async function getBatches(seriesType?:ProfileBatchSeriesType){const endpoint=seriesType?`/api/profile/masters/batches?seriesType=${encodeURIComponent(seriesType)}`:"/api/profile/masters/batches";const r=await apiRequest<MasterResponse<ProfileBatch[]>>(endpoint,{method:"GET"});return r.data??[];}
async function adminRequest<T>(endpoint:string,method:"GET"|"POST"|"PUT"|"PATCH",body?:unknown){const r=await apiRequest<MasterResponse<T>>(endpoint,{method,...(body===undefined?{}:{body:JSON.stringify(body)})});if(!r.data)throw new Error(r.message||"Profile master operation failed.");return r.data;}
export const getAdminProfileEmploymentTypes=()=>adminRequest<ProfileEmploymentTypeMaster[]>("/api/admin/profile-masters/employment-types","GET");
export const getAdminProfileOrgUnits=()=>adminRequest<AdminProfileOrgUnit[]>("/api/admin/profile-masters/org-units","GET");
export const getAdminProfileBanks=()=>adminRequest<AdminProfileBank[]>("/api/admin/profile-masters/banks","GET");
export const getAdminProfileDesignations=()=>adminRequest<AdminProfileDesignation[]>("/api/admin/profile-masters/designations","GET");
export const getAdminProfileStreams=()=>adminRequest<AdminProfileStream[]>("/api/admin/profile-masters/streams","GET");
export const getAdminProfileMscBatches=()=>adminRequest<AdminProfileMscBatch[]>("/api/admin/profile-masters/msc-batches","GET");
export const getAdminProfileCourses=()=>adminRequest<AdminProfileCourse[]>("/api/admin/profile-masters/courses","GET");
export const getAdminProfileTraineeBatches=()=>adminRequest<AdminProfileTraineeBatch[]>("/api/admin/profile-masters/trainee-batches","GET");
export const createProfileOrgUnit=(p:ProfileOrgUnitAdminPayload)=>adminRequest<AdminProfileOrgUnit>("/api/admin/profile-masters/org-units","POST",p);
export const updateProfileOrgUnit=(id:number,p:ProfileOrgUnitAdminPayload)=>adminRequest<AdminProfileOrgUnit>(`/api/admin/profile-masters/org-units/${id}`,"PUT",p);
export const updateProfileOrgUnitStatus=(id:number,status:MasterStatus)=>adminRequest<{id:number;status:MasterStatus}>(`/api/admin/profile-masters/org-units/${id}/status`,"PATCH",{status});
export const createProfileBank=(p:ProfileBankAdminPayload)=>adminRequest<AdminProfileBank>("/api/admin/profile-masters/banks","POST",p);
export const updateProfileBank=(id:number,p:ProfileBankAdminPayload)=>adminRequest<AdminProfileBank>(`/api/admin/profile-masters/banks/${id}`,"PUT",p);
export const updateProfileBankStatus=(id:number,status:MasterStatus)=>adminRequest<{id:number;status:MasterStatus}>(`/api/admin/profile-masters/banks/${id}/status`,"PATCH",{status});
export const createProfileDesignation=(p:ProfileDesignationAdminPayload)=>adminRequest<AdminProfileDesignation>("/api/admin/profile-masters/designations","POST",p);
export const updateProfileDesignation=(id:number,p:ProfileDesignationAdminPayload)=>adminRequest<AdminProfileDesignation>(`/api/admin/profile-masters/designations/${id}`,"PUT",p);
export const updateProfileDesignationStatus=(id:number,status:MasterStatus)=>adminRequest<{id:number;status:MasterStatus}>(`/api/admin/profile-masters/designations/${id}/status`,"PATCH",{status});
export const createProfileStream=(p:ProfileStreamAdminPayload)=>adminRequest<AdminProfileStream>("/api/admin/profile-masters/streams","POST",p);
export const updateProfileStream=(id:number,p:ProfileStreamAdminPayload)=>adminRequest<AdminProfileStream>(`/api/admin/profile-masters/streams/${id}`,"PUT",p);
export const updateProfileStreamStatus=(id:number,status:MasterStatus)=>adminRequest<{id:number;status:MasterStatus}>(`/api/admin/profile-masters/streams/${id}/status`,"PATCH",{status});
export const createProfileMscBatch=(p:ProfileMscBatchAdminPayload)=>adminRequest<AdminProfileMscBatch>("/api/admin/profile-masters/msc-batches","POST",p);
export const updateProfileMscBatch=(id:number,p:ProfileMscBatchAdminPayload)=>adminRequest<AdminProfileMscBatch>(`/api/admin/profile-masters/msc-batches/${id}`,"PUT",p);
export const updateProfileMscBatchStatus=(id:number,status:MasterStatus)=>adminRequest<{id:number;status:MasterStatus}>(`/api/admin/profile-masters/msc-batches/${id}/status`,"PATCH",{status});
export const createProfileCourse=(p:ProfileCourseAdminPayload)=>adminRequest<AdminProfileCourse>("/api/admin/profile-masters/courses","POST",p);
export const updateProfileCourse=(id:number,p:ProfileCourseAdminPayload)=>adminRequest<AdminProfileCourse>(`/api/admin/profile-masters/courses/${id}`,"PUT",p);
export const updateProfileCourseStatus=(id:number,status:MasterStatus)=>adminRequest<{id:number;status:MasterStatus}>(`/api/admin/profile-masters/courses/${id}/status`,"PATCH",{status});
export const createProfileTraineeBatch=(p:ProfileTraineeBatchAdminPayload)=>adminRequest<AdminProfileTraineeBatch>("/api/admin/profile-masters/trainee-batches","POST",p);
export const updateProfileTraineeBatch=(id:number,p:ProfileTraineeBatchAdminPayload)=>adminRequest<AdminProfileTraineeBatch>(`/api/admin/profile-masters/trainee-batches/${id}`,"PUT",p);
export const updateProfileTraineeBatchStatus=(id:number,status:MasterStatus)=>adminRequest<{id:number;status:MasterStatus}>(`/api/admin/profile-masters/trainee-batches/${id}/status`,"PATCH",{status});
export async function getPincodeDetails(pincode:string){const r=await apiRequest<PincodeResponse>(`/api/profile/pincode/${encodeURIComponent(pincode)}`,{method:"GET"});if(!r.data)throw new Error(r.message||"PIN code not found.");return r.data;}
export async function uploadProfilePhoto(file:File){if(!(file instanceof File))throw new Error("A valid profile photo file is required.");const formData=new FormData();formData.append("photo",file);const r=await apiRequest<ProfileResponse>("/api/profile/photo",{method:"POST",body:formData});if(!r.profile)throw new Error(r.message||"Profile photo upload did not return the saved profile.");return r.profile;}
export function getProfilePhotoUrl(){return "/api/profile/photo";}
