import type { Request, Response } from "express";
import * as service from "../services/profile-master.service";

function handle(res:Response, work:()=>Promise<unknown>, fallback:string){return work().then(data=>res.json({success:true,data})).catch(error=>{console.error(fallback,error);return res.status(400).json({success:false,message:error instanceof Error?error.message:fallback});});}
export function getEmploymentTypes(_req:Request,res:Response){return handle(res,service.listEmploymentTypes,"Unable to fetch employment types.");}
export function getOrgUnits(req:Request,res:Response){const raw=req.query.type;const types=raw===undefined?undefined:Array.isArray(raw)?raw.map(String):[String(raw)];return handle(res,()=>service.listOrgUnits(types),"Unable to fetch organization units.");}
export function getBanks(_req:Request,res:Response){return handle(res,service.listBanks,"Unable to fetch banks.");}
export function getDesignations(req:Request,res:Response){return handle(res,()=>service.listDesignations(req.query.employmentTypeId),"Unable to fetch designations.");}
export function getStreams(_req:Request,res:Response){return handle(res,service.listStreams,"Unable to fetch streams.");}
export function getMscBatches(req:Request,res:Response){return handle(res,()=>service.listMscBatches(req.query.streamId),"Unable to fetch MSc batches.");}
export function getCourses(_req:Request,res:Response){return handle(res,service.listCourses,"Unable to fetch courses.");}
export function getTraineeBatches(req:Request,res:Response){return handle(res,()=>service.listTraineeBatches(req.query.courseId),"Unable to fetch trainee batches.");}
export function getBatchSeries(req:Request,res:Response){return handle(res,()=>service.listBatchSeries(req.query.seriesType),"Unable to fetch batch series.");}
export function getBatches(req:Request,res:Response){return handle(res,()=>service.listBatches(req.query.seriesType),"Unable to fetch batches.");}
export function getProfileOfficers(_req:Request,res:Response){return handle(res,service.listProfileOfficers,"Unable to fetch profile officers.");}
