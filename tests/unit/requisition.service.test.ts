import { describe, expect, it, vi } from "vitest";

// ------------------------------------------------------------
// Unit-test isolation
// ------------------------------------------------------------
// requisition.service.ts imports repositories, which import the
// database connection module. The real connection module throws
// when DB_PASSWORD is not present.
//
// Unit tests must not require a live database, so we mock the
// connection module before importing requisition.service.ts.
// ------------------------------------------------------------
vi.mock("../../server/db/connection", () => ({
  db: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
  isDbConnected: false,
  testDatabaseConnection: vi.fn(),
}));

import {
  normalizeRole,
  canViewRequisition,
} from "../../server/services/requisition.service";

describe("normalizeRole", () => {
  it("maps legacy user role to applicant", () => {
    expect(normalizeRole("user")).toBe("applicant");
  });

  it("normalizes role casing and whitespace", () => {
    expect(normalizeRole("  SUPERVISOR  ")).toBe("supervisor");
  });

  it("keeps unknown role values normalized", () => {
    expect(normalizeRole(" custom_role ")).toBe("custom_role");
  });

  it("handles null and undefined safely", () => {
    expect(normalizeRole(null)).toBe("");
    expect(normalizeRole(undefined)).toBe("");
  });
});

describe("canViewRequisition", () => {
  const baseRequisition = {
    applicant_id: "101",
    requisition_type: "IT_HRMS",
    status: "submitted_pending_pi",
  };

  it("denies access when requisition is missing", () => {
    expect(canViewRequisition(null, "101", "applicant")).toBe(false);
  });

  it("allows admin to see every requisition", () => {
    expect(
      canViewRequisition(
        { ...baseRequisition, applicant_id: "999" },
        "101",
        "admin",
      ),
    ).toBe(true);
  });

  it("allows super_admin to see every requisition", () => {
    expect(
      canViewRequisition(
        { ...baseRequisition, applicant_id: "999" },
        "101",
        "super_admin",
      ),
    ).toBe(true);
  });

  it("allows an applicant to see their own requisition", () => {
    expect(canViewRequisition(baseRequisition, "101", "applicant")).toBe(true);
  });

  it("denies an applicant access to another applicant's requisition", () => {
    expect(canViewRequisition(baseRequisition, "202", "applicant")).toBe(false);
  });

  it("denies supervisors access to draft requisitions", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          status: "draft",
        },
        "55",
        "supervisor",
      ),
    ).toBe(false);
  });

  it("denies supervisors access to deactivated requisitions", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          status: "deactivated",
        },
        "55",
        "supervisor",
      ),
    ).toBe(false);
  });

  it("allows supervisors to see submitted requisitions", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          status: "submitted_pending_pi",
        },
        "55",
        "supervisor",
      ),
    ).toBe(true);
  });

  it("denies lab nodal roles for IT-only requisitions", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          requisition_type: "IT_HRMS",
          status: "in_lab_review",
        },
        "55",
        "lab_nodal",
      ),
    ).toBe(false);
  });

  it("allows lab nodal roles for lab requisitions in lab workflow", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          requisition_type: "LAB_FACILITY",
          status: "in_lab_review",
        },
        "55",
        "lab_nodal",
      ),
    ).toBe(true);
  });

  it("allows associate lab nodal roles for lab workflow", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          requisition_type: "LAB_FACILITY",
          status: "pending_section_head",
        },
        "55",
        "assoc_lab_nodal",
      ),
    ).toBe(true);
  });

  it("allows IT officer for IT requisitions during technical verification", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          requisition_type: "IT_HRMS",
          status: "in_tech_verification",
        },
        "55",
        "it_officer",
      ),
    ).toBe(true);
  });

  it("allows HRMS officer for combined IT requisitions during technical verification", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          requisition_type: "COMBINED",
          status: "in_tech_verification",
        },
        "55",
        "hrms_officer",
      ),
    ).toBe(true);
  });

  it("denies IT officer for lab-only requisitions", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          requisition_type: "LAB_FACILITY",
          status: "in_tech_verification",
        },
        "55",
        "it_officer",
      ),
    ).toBe(false);
  });

  it("allows section head at pending_section_head stage", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          status: "pending_section_head",
        },
        "55",
        "section_head",
      ),
    ).toBe(true);
  });

  it("allows section head to see final/rejected workflow records", () => {
    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          status: "approved_provisioned",
        },
        "55",
        "section_head",
      ),
    ).toBe(true);

    expect(
      canViewRequisition(
        {
          ...baseRequisition,
          status: "rejected",
        },
        "55",
        "section_head",
      ),
    ).toBe(true);
  });
});
