import type { Request, Response } from "express";
import * as service from "../services/profile-master-admin.service";
import { listBatches } from "../services/profile-master.service";

function message(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
function id(req: Request) { return req.params.id; }
function ok(res: Response, data: unknown, messageText?: string, status = 200) { return res.status(status).json({ success: true, ...(messageText ? { message: messageText } : {}), data }); }
function fail(res: Response, error: unknown, fallback: string) { return res.status(400).json({ success: false, message: message(error, fallback) }); }

export async function getAdminEmploymentTypes(_req: Request, res: Response) { try { return ok(res, await service.listAdminEmploymentTypes()); } catch (e) { return fail(res,e,"Unable to load employment types."); } }
export async function getAdminOrgUnits(_req: Request, res: Response) { try { return ok(res, await service.listAdminOrgUnits()); } catch (e) { return fail(res,e,"Unable to load organizations."); } }
export async function getAdminBanks(_req: Request, res: Response) { try { return ok(res, await service.listAdminBanks()); } catch (e) { return fail(res,e,"Unable to load banks."); } }
export async function getAdminDesignations(_req: Request, res: Response) { try { return ok(res, await service.listAdminDesignations()); } catch (e) { return fail(res,e,"Unable to load designations."); } }
export async function getAdminStreams(_req: Request, res: Response) { try { return ok(res, await service.listAdminStreams()); } catch (e) { return fail(res,e,"Unable to load streams."); } }
export async function getAdminMscBatches(_req: Request, res: Response) { try { return ok(res, await service.listAdminMscBatches()); } catch (e) { return fail(res,e,"Unable to load MSc batches."); } }
export async function getAdminCourses(_req: Request, res: Response) { try { return ok(res, await service.listAdminCourses()); } catch (e) { return fail(res,e,"Unable to load courses."); } }
export async function getAdminTraineeBatches(_req: Request, res: Response) { try { return ok(res, await service.listAdminTraineeBatches()); } catch (e) { return fail(res,e,"Unable to load trainee batches."); } }

// Compatibility read for the older AdminControlPage while the UI is migrated to
// the separate MSc/Trainee batch masters. This is intentionally read-only here.
export async function getLegacyBatches(req: Request, res: Response) {
  try {
    const seriesType = typeof req.query.seriesType === "string" ? req.query.seriesType : undefined;
    return ok(res, await listBatches(seriesType as any));
  } catch (e) {
    return fail(res, e, "Unable to load batches.");
  }
}

export async function deleteEmploymentType(req:Request,res:Response){try{return ok(res,await service.removeEmploymentType(id(req)),"Employment type deleted successfully.");}catch(e){return fail(res,e,"Unable to delete employment type.");}}
export async function createEmploymentType(req:Request,res:Response){try{return ok(res,await service.addEmploymentType(req.body),"Employment type created successfully.",201);}catch(e){return fail(res,e,"Unable to create employment type.");}}
export async function updateEmploymentType(req:Request,res:Response){try{return ok(res,await service.editEmploymentType(id(req),req.body),"Employment type updated successfully.");}catch(e){return fail(res,e,"Unable to update employment type.");}}
export async function updateEmploymentTypeStatus(req:Request,res:Response){try{return ok(res,await service.changeEmploymentTypeStatus(id(req),req.body?.status),"Employment type status updated successfully.");}catch(e){return fail(res,e,"Unable to update employment type status.");}}
export async function deleteOrgUnit(req:Request,res:Response){try{return ok(res,await service.removeOrgUnit(id(req)),"Organization deleted successfully.");}catch(e){return fail(res,e,"Unable to delete organization.");}}
export async function createOrgUnit(req:Request,res:Response){try{return ok(res,await service.addOrgUnit(req.body),"Organization created successfully.",201);}catch(e){return fail(res,e,"Unable to create organization.");}}
export async function updateOrgUnit(req:Request,res:Response){try{return ok(res,await service.editOrgUnit(id(req),req.body),"Organization updated successfully.");}catch(e){return fail(res,e,"Unable to update organization.");}}
export async function updateOrgUnitStatus(req:Request,res:Response){try{return ok(res,await service.changeOrgUnitStatus(id(req),req.body?.status),"Organization status updated successfully.");}catch(e){return fail(res,e,"Unable to update organization status.");}}
export async function deleteBank(req:Request,res:Response){try{return ok(res,await service.removeBank(id(req)),"Bank deleted successfully.");}catch(e){return fail(res,e,"Unable to delete bank.");}}
export async function createBank(req:Request,res:Response){try{return ok(res,await service.addBank(req.body),"Bank created successfully.",201);}catch(e){return fail(res,e,"Unable to create bank.");}}
export async function updateBank(req:Request,res:Response){try{return ok(res,await service.editBank(id(req),req.body),"Bank updated successfully.");}catch(e){return fail(res,e,"Unable to update bank.");}}
export async function updateBankStatus(req:Request,res:Response){try{return ok(res,await service.changeBankStatus(id(req),req.body?.status),"Bank status updated successfully.");}catch(e){return fail(res,e,"Unable to update bank status.");}}
export async function deleteDesignation(req:Request,res:Response){try{return ok(res,await service.removeDesignation(id(req)),"Designation deleted successfully.");}catch(e){return fail(res,e,"Unable to delete designation.");}}
export async function createDesignation(req:Request,res:Response){try{return ok(res,await service.addDesignation(req.body),"Designation created successfully.",201);}catch(e){return fail(res,e,"Unable to create designation.");}}
export async function updateDesignation(req:Request,res:Response){try{return ok(res,await service.editDesignation(id(req),req.body),"Designation updated successfully.");}catch(e){return fail(res,e,"Unable to update designation.");}}
export async function updateDesignationStatus(req:Request,res:Response){try{return ok(res,await service.changeDesignationStatus(id(req),req.body?.status),"Designation status updated successfully.");}catch(e){return fail(res,e,"Unable to update designation status.");}}
export async function deleteStream(req:Request,res:Response){try{return ok(res,await service.removeStream(id(req)),"Stream deleted successfully.");}catch(e){return fail(res,e,"Unable to delete stream.");}}
export async function createStream(req:Request,res:Response){try{return ok(res,await service.addStream(req.body),"Stream created successfully.",201);}catch(e){return fail(res,e,"Unable to create stream.");}}
export async function updateStream(req:Request,res:Response){try{return ok(res,await service.editStream(id(req),req.body),"Stream updated successfully.");}catch(e){return fail(res,e,"Unable to update stream.");}}
export async function updateStreamStatus(req:Request,res:Response){try{return ok(res,await service.changeStreamStatus(id(req),req.body?.status),"Stream status updated successfully.");}catch(e){return fail(res,e,"Unable to update stream status.");}}
export async function deleteMscBatch(req:Request,res:Response){try{return ok(res,await service.removeMscBatch(id(req)),"MSc batch deleted successfully.");}catch(e){return fail(res,e,"Unable to delete msc batch.");}}
export async function createMscBatch(req:Request,res:Response){try{return ok(res,await service.addMscBatch(req.body),"MSc batch created successfully.",201);}catch(e){return fail(res,e,"Unable to create MSc batch.");}}
export async function updateMscBatch(req:Request,res:Response){try{return ok(res,await service.editMscBatch(id(req),req.body),"MSc batch updated successfully.");}catch(e){return fail(res,e,"Unable to update MSc batch.");}}
export async function updateMscBatchStatus(req:Request,res:Response){try{return ok(res,await service.changeMscBatchStatus(id(req),req.body?.status),"MSc batch status updated successfully.");}catch(e){return fail(res,e,"Unable to update MSc batch status.");}}
export async function deleteCourse(req:Request,res:Response){try{return ok(res,await service.removeCourse(id(req)),"Course deleted successfully.");}catch(e){return fail(res,e,"Unable to delete course.");}}
export async function createCourse(req:Request,res:Response){try{return ok(res,await service.addCourse(req.body),"Course created successfully.",201);}catch(e){return fail(res,e,"Unable to create course.");}}
export async function updateCourse(req:Request,res:Response){try{return ok(res,await service.editCourse(id(req),req.body),"Course updated successfully.");}catch(e){return fail(res,e,"Unable to update course.");}}
export async function updateCourseStatus(req:Request,res:Response){try{return ok(res,await service.changeCourseStatus(id(req),req.body?.status),"Course status updated successfully.");}catch(e){return fail(res,e,"Unable to update course status.");}}
export async function deleteTraineeBatch(req:Request,res:Response){try{return ok(res,await service.removeTraineeBatch(id(req)),"Trainee batch deleted successfully.");}catch(e){return fail(res,e,"Unable to delete trainee batch.");}}
export async function createTraineeBatch(req:Request,res:Response){try{return ok(res,await service.addTraineeBatch(req.body),"Trainee batch created successfully.",201);}catch(e){return fail(res,e,"Unable to create trainee batch.");}}
export async function updateTraineeBatch(req:Request,res:Response){try{return ok(res,await service.editTraineeBatch(id(req),req.body),"Trainee batch updated successfully.");}catch(e){return fail(res,e,"Unable to update trainee batch.");}}
export async function updateTraineeBatchStatus(req:Request,res:Response){try{return ok(res,await service.changeTraineeBatchStatus(id(req),req.body?.status),"Trainee batch status updated successfully.");}catch(e){return fail(res,e,"Unable to update trainee batch status.");}}
