import { db } from "../db/connection";

export type MasterStatus = "active" | "inactive";
export type ProfileOrgUnitType = "department" | "cell" | "project";

export interface CreateOrgUnitInput { unitType: ProfileOrgUnitType; unitName: string; unitCode: string; description?: string | null; }
export interface CreateBankInput { bankName: string; bankCode: string; }
export interface CreateDesignationInput { employmentTypeId: number; designationName: string; designationCode: string; }
export interface CreateStreamInput { streamName: string; streamCode: string; }
export interface CreateMscBatchInput { streamId: number; batchNumber: number; batchName: string; batchCode: string; validityStartYear: number; validityEndYear: number; }
export interface CreateCourseInput { courseName: string; courseCode: string; }
export interface CreateTraineeBatchInput { courseId: number; batchNumber: number; batchName: string; batchCode: string; validityStartYear: number; validityEndYear: number; }

export async function listAllEmploymentTypes() {
  const [rows]: any = await db.query(`SELECT id, code, display_name, status FROM profile_employment_types ORDER BY id ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), code: String(row.code), displayName: String(row.display_name), status: row.status as MasterStatus }));
}
export async function listAllOrgUnits() {
  const [rows]: any = await db.query(`SELECT id, unit_type, unit_name, unit_code, description, status FROM profile_org_units ORDER BY unit_type ASC, unit_name ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), unitType: row.unit_type as ProfileOrgUnitType, unitName: String(row.unit_name), unitCode: String(row.unit_code ?? ""), description: row.description ?? null, status: row.status as MasterStatus }));
}
export async function listAllBanks() {
  const [rows]: any = await db.query(`SELECT id, bank_name, bank_code, status FROM profile_bank_masters ORDER BY bank_name ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), bankName: String(row.bank_name), bankCode: String(row.bank_code ?? ""), status: row.status as MasterStatus }));
}
export async function listAllDesignations() {
  const [rows]: any = await db.query(`SELECT d.id, d.employment_type_id, et.code AS employment_type_code, et.display_name AS employment_type_name, d.designation_name, d.designation_code, d.status FROM profile_designation_masters d INNER JOIN profile_employment_types et ON et.id = d.employment_type_id ORDER BY et.id ASC, d.designation_name ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), employmentTypeId: Number(row.employment_type_id), employmentTypeCode: String(row.employment_type_code), employmentTypeName: String(row.employment_type_name), designationName: String(row.designation_name), designationCode: String(row.designation_code), status: row.status as MasterStatus }));
}
export async function listAllStreams() {
  const [rows]: any = await db.query(`SELECT id, stream_name, stream_code, status FROM profile_stream_masters ORDER BY stream_name ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), streamName: String(row.stream_name), streamCode: String(row.stream_code), status: row.status as MasterStatus }));
}
export async function listAllMscBatches() {
  const [rows]: any = await db.query(`SELECT b.id, b.stream_id, s.stream_name, s.stream_code, b.batch_number, b.batch_name, b.batch_code, b.validity_start_year, b.validity_end_year, b.status FROM profile_msc_batches b INNER JOIN profile_stream_masters s ON s.id = b.stream_id ORDER BY s.stream_name ASC, b.batch_number DESC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), streamId: Number(row.stream_id), streamName: String(row.stream_name), streamCode: String(row.stream_code), batchNumber: Number(row.batch_number), batchName: String(row.batch_name), batchCode: String(row.batch_code), validityStartYear: Number(row.validity_start_year), validityEndYear: Number(row.validity_end_year), status: row.status as MasterStatus }));
}
export async function listAllCourses() {
  const [rows]: any = await db.query(`SELECT id, course_name, course_code, status FROM profile_course_masters ORDER BY course_name ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), courseName: String(row.course_name), courseCode: String(row.course_code), status: row.status as MasterStatus }));
}
export async function listAllTraineeBatches() {
  const [rows]: any = await db.query(`SELECT b.id, b.course_id, c.course_name, c.course_code, b.batch_number, b.batch_name, b.batch_code, b.validity_start_year, b.validity_end_year, b.status FROM profile_trainee_batches b INNER JOIN profile_course_masters c ON c.id = b.course_id ORDER BY c.course_name ASC, b.batch_number DESC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), courseId: Number(row.course_id), courseName: String(row.course_name), courseCode: String(row.course_code), batchNumber: Number(row.batch_number), batchName: String(row.batch_name), batchCode: String(row.batch_code), validityStartYear: Number(row.validity_start_year), validityEndYear: Number(row.validity_end_year), status: row.status as MasterStatus }));
}

export async function createOrgUnit(input: CreateOrgUnitInput) { const [r]: any = await db.query(`INSERT INTO profile_org_units (unit_type, unit_name, unit_code, description, status) VALUES (?, ?, ?, ?, 'active')`, [input.unitType, input.unitName, input.unitCode, input.description ?? null]); const [rows]: any = await db.query(`SELECT id, unit_type, unit_name, unit_code, description, status FROM profile_org_units WHERE id = ?`, [r.insertId]); return rows?.[0] ?? null; }
export async function updateOrgUnit(id: number, input: CreateOrgUnitInput) { await db.query(`UPDATE profile_org_units SET unit_type=?, unit_name=?, unit_code=?, description=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [input.unitType,input.unitName,input.unitCode,input.description??null,id]); const [rows]: any=await db.query(`SELECT id,unit_type,unit_name,unit_code,description,status FROM profile_org_units WHERE id=?`,[id]); return rows?.[0]??null; }
export async function setOrgUnitStatus(id:number,status:MasterStatus){await db.query(`UPDATE profile_org_units SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[status,id]);}

export async function createBank(input:CreateBankInput){const [r]:any=await db.query(`INSERT INTO profile_bank_masters (bank_name,bank_code,status) VALUES (?,?,'active')`,[input.bankName,input.bankCode]);const [rows]:any=await db.query(`SELECT id,bank_name,bank_code,status FROM profile_bank_masters WHERE id=?`,[r.insertId]);return rows?.[0]??null;}
export async function updateBank(id:number,input:CreateBankInput){await db.query(`UPDATE profile_bank_masters SET bank_name=?,bank_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[input.bankName,input.bankCode,id]);const [rows]:any=await db.query(`SELECT id,bank_name,bank_code,status FROM profile_bank_masters WHERE id=?`,[id]);return rows?.[0]??null;}
export async function setBankStatus(id:number,status:MasterStatus){await db.query(`UPDATE profile_bank_masters SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[status,id]);}

export async function createDesignation(input:CreateDesignationInput){const [r]:any=await db.query(`INSERT INTO profile_designation_masters (employment_type_id,designation_name,designation_code,status) VALUES (?,?,?,'active')`,[input.employmentTypeId,input.designationName,input.designationCode]);const [rows]:any=await db.query(`SELECT id FROM profile_designation_masters WHERE id=?`,[r.insertId]);return rows?.[0]??null;}
export async function updateDesignation(id:number,input:CreateDesignationInput){await db.query(`UPDATE profile_designation_masters SET employment_type_id=?,designation_name=?,designation_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[input.employmentTypeId,input.designationName,input.designationCode,id]);const [rows]:any=await db.query(`SELECT id FROM profile_designation_masters WHERE id=?`,[id]);return rows?.[0]??null;}
export async function setDesignationStatus(id:number,status:MasterStatus){await db.query(`UPDATE profile_designation_masters SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[status,id]);}

export async function createStream(input:CreateStreamInput){const [r]:any=await db.query(`INSERT INTO profile_stream_masters (stream_name,stream_code,status) VALUES (?,?, 'active')`,[input.streamName,input.streamCode]);const [rows]:any=await db.query(`SELECT id FROM profile_stream_masters WHERE id=?`,[r.insertId]);return rows?.[0]??null;}
export async function updateStream(id:number,input:CreateStreamInput){await db.query(`UPDATE profile_stream_masters SET stream_name=?,stream_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[input.streamName,input.streamCode,id]);const [rows]:any=await db.query(`SELECT id FROM profile_stream_masters WHERE id=?`,[id]);return rows?.[0]??null;}
export async function setStreamStatus(id:number,status:MasterStatus){await db.query(`UPDATE profile_stream_masters SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[status,id]);}

export async function createMscBatch(input:CreateMscBatchInput){const [r]:any=await db.query(`INSERT INTO profile_msc_batches (stream_id,batch_number,batch_name,batch_code,validity_start_year,validity_end_year,status) VALUES (?,?,?,?,?,?,'active')`,[input.streamId,input.batchNumber,input.batchName,input.batchCode,input.validityStartYear,input.validityEndYear]);const [rows]:any=await db.query(`SELECT id FROM profile_msc_batches WHERE id=?`,[r.insertId]);return rows?.[0]??null;}
export async function updateMscBatch(id:number,input:CreateMscBatchInput){await db.query(`UPDATE profile_msc_batches SET stream_id=?,batch_number=?,batch_name=?,batch_code=?,validity_start_year=?,validity_end_year=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[input.streamId,input.batchNumber,input.batchName,input.batchCode,input.validityStartYear,input.validityEndYear,id]);const [rows]:any=await db.query(`SELECT id FROM profile_msc_batches WHERE id=?`,[id]);return rows?.[0]??null;}
export async function setMscBatchStatus(id:number,status:MasterStatus){await db.query(`UPDATE profile_msc_batches SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[status,id]);}

export async function createCourse(input:CreateCourseInput){const [r]:any=await db.query(`INSERT INTO profile_course_masters (course_name,course_code,status) VALUES (?,?, 'active')`,[input.courseName,input.courseCode]);const [rows]:any=await db.query(`SELECT id FROM profile_course_masters WHERE id=?`,[r.insertId]);return rows?.[0]??null;}
export async function updateCourse(id:number,input:CreateCourseInput){await db.query(`UPDATE profile_course_masters SET course_name=?,course_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[input.courseName,input.courseCode,id]);const [rows]:any=await db.query(`SELECT id FROM profile_course_masters WHERE id=?`,[id]);return rows?.[0]??null;}
export async function setCourseStatus(id:number,status:MasterStatus){await db.query(`UPDATE profile_course_masters SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[status,id]);}

export async function createTraineeBatch(input:CreateTraineeBatchInput){const [r]:any=await db.query(`INSERT INTO profile_trainee_batches (course_id,batch_number,batch_name,batch_code,validity_start_year,validity_end_year,status) VALUES (?,?,?,?,?,?,'active')`,[input.courseId,input.batchNumber,input.batchName,input.batchCode,input.validityStartYear,input.validityEndYear]);const [rows]:any=await db.query(`SELECT id FROM profile_trainee_batches WHERE id=?`,[r.insertId]);return rows?.[0]??null;}
export async function updateTraineeBatch(id:number,input:CreateTraineeBatchInput){await db.query(`UPDATE profile_trainee_batches SET course_id=?,batch_number=?,batch_name=?,batch_code=?,validity_start_year=?,validity_end_year=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[input.courseId,input.batchNumber,input.batchName,input.batchCode,input.validityStartYear,input.validityEndYear,id]);const [rows]:any=await db.query(`SELECT id FROM profile_trainee_batches WHERE id=?`,[id]);return rows?.[0]??null;}
export async function setTraineeBatchStatus(id:number,status:MasterStatus){await db.query(`UPDATE profile_trainee_batches SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[status,id]);}
