import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLoginController } from "../middleware/authControllerFactory.js";

vi.mock("../service/JWT.js", () => ({
  getJWT: vi.fn((payload) => `fake-jwt:${JSON.stringify(payload)}`),
}));

function fakeModel(doc) {
  return {
    findOne: vi.fn(() => ({
      select: vi.fn(async () => doc),
    })),
  };
}

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.send = vi.fn(() => res);
  return res;
}

describe("createLoginController", () => {
  let next;
  beforeEach(() => {
    next = vi.fn();
  });

  it("rejects a request missing email or password with a 400 CustomError", async () => {
    const controller = createLoginController({ Model: fakeModel(null), notRegisteredMessage: () => "n/a" });
    const req = { body: { email: "" } };
    const res = mockRes();

    await controller(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it("rejects an unregistered/unverified account with a 401 using the caller's message", async () => {
    const controller = createLoginController({
      Model: fakeModel(null),
      notRegisteredMessage: (email) => `no account for ${email}`,
    });
    const req = { body: { email: "ghost@example.com", password: "x" } };
    const res = mockRes();

    await controller(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toBe("no account for ghost@example.com");
  });

  it("rejects a wrong password with 401 and never issues a token", async () => {
    const doc = { _id: "u1", email: "a@b.com", verified: true, comparePassword: vi.fn(async () => false) };
    const controller = createLoginController({ Model: fakeModel(doc), notRegisteredMessage: () => "n/a" });
    const req = { body: { email: "a@b.com", password: "wrong" } };
    const res = mockRes();

    controller(req, res, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledTimes(1));

    expect(doc.comparePassword).toHaveBeenCalledWith("wrong");
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(res.send).not.toHaveBeenCalled();
  });

  it("issues a 200 with a token and merges extraJwtClaims on success", async () => {
    const doc = { _id: "u1", email: "a@b.com", verified: true, comparePassword: vi.fn(async () => true) };
    const controller = createLoginController({
      Model: fakeModel(doc),
      notRegisteredMessage: () => "n/a",
      extraJwtClaims: (d) => ({ type: "doctor", uid: d._id }),
      successMessage: () => "welcome back",
    });
    const req = { body: { email: "a@b.com", password: "correct" } };
    const res = mockRes();

    controller(req, res, next);
    await vi.waitFor(() => expect(res.send).toHaveBeenCalled());

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.send.mock.calls[0][0];
    expect(payload.status).toBe("success");
    expect(payload.message).toBe("welcome back");
    expect(payload.token).toContain('"type":"doctor"');
  });

  it("treats an unverified account the same as a non-existent one", async () => {
    const doc = { _id: "u1", email: "a@b.com", verified: false, comparePassword: vi.fn(async () => true) };
    const controller = createLoginController({ Model: fakeModel(doc), notRegisteredMessage: () => "unverified" });
    const req = { body: { email: "a@b.com", password: "correct" } };
    const res = mockRes();

    await controller(req, res, next);

    expect(doc.comparePassword).not.toHaveBeenCalled();
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});
