import { describe, it, expect, vi, beforeEach } from "vitest";

const findOneMock = vi.fn();

vi.mock("../models/hospital/patientAccessModel.js", () => ({
  default: { findOne: (...args) => findOneMock(...args) },
}));
vi.mock("../models/models.js", () => ({
  MedicalDocument: {},
  AuditLog: {},
}));

const { verifyAuthorizedAccess } = await import("../middleware/documentAccess.js");

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("verifyAuthorizedAccess", () => {
  let next;
  beforeEach(() => {
    next = vi.fn();
    findOneMock.mockReset();
  });

  it("400s when patientId is missing from the route params", async () => {
    const req = { params: {}, role: "doctor", doctor: { _id: "d1" } };
    const res = mockRes();

    await verifyAuthorizedAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("403s a patient or unrecognized role attempting to hit a doctor/hospital-only route", async () => {
    const req = { params: { patientId: "p1" }, role: "patient", user: { _id: "p1" } };
    const res = mockRes();

    await verifyAuthorizedAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(findOneMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("403s a doctor with no matching PatientAccess grant — the core authorization gate", async () => {
    findOneMock.mockResolvedValue(null);
    const req = { params: { patientId: "p1" }, role: "doctor", doctor: { _id: "d1" } };
    const res = mockRes();

    await verifyAuthorizedAccess(req, res, next);

    expect(findOneMock).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: "p1", doctorId: "d1", isActive: true }),
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when an active, unexpired grant exists for the requesting doctor", async () => {
    findOneMock.mockResolvedValue({ _id: "grant1" });
    const req = { params: { patientId: "p1" }, role: "doctor", doctor: { _id: "d1" } };
    const res = mockRes();

    await verifyAuthorizedAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("queries by hospitalId (not doctorId) when the requester is a hospital", async () => {
    findOneMock.mockResolvedValue({ _id: "grant1" });
    const req = { params: { patientId: "p1" }, role: "hospital", hospital: { _id: "h1" } };
    const res = mockRes();

    await verifyAuthorizedAccess(req, res, next);

    const query = findOneMock.mock.calls[0][0];
    expect(query.hospitalId).toBe("h1");
    expect(query.doctorId).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
