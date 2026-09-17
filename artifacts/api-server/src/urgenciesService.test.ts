import assert from "node:assert/strict";
import test from "node:test";
import { EMERGENCY_SERVICES, urgenciesService } from "./urgenciesService";

test("publie les trois numéros confirmés et les quatre services prioritaires restaurés", () => {
  assert.deepEqual(
    EMERGENCY_SERVICES.map((service) => service.phone),
    ["17", "18", "16", "112", "1010", "199", "50400504"],
  );
  assert.deepEqual(
    EMERGENCY_SERVICES.filter(
      (service) => service.verificationStatus === "priority-restored",
    ).map((service) => service.phone),
    ["112", "1010", "199", "50400504"],
  );
});

test("ne republie aucune fiche locale historique non recoupée", () => {
  const services = urgenciesService.getAllEmergencies();

  assert.equal(services.length, 7);
  assert.ok(services.every((service) => service.city === "National"));
  assert.ok(
    services.every((service) => service.id.startsWith("national-")),
  );
});

test("les statistiques gardent la trace des 113 fiches historiques", () => {
  const stats = urgenciesService.getStats();

  assert.equal(stats.total, 7);
  assert.equal(stats.verification.audit.snapshotCount, 113);
  assert.equal(stats.verification.excludedUnverifiedCount, 106);
  assert.equal(stats.verification.audit.localSecurityCount, 44);
});