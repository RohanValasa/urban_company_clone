const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { inTelangana } = require("../src/lib/geo");

test("Telangana towns are inside, neighbouring states are not", () => {
  const inside = {
    Hyderabad: [17.385, 78.4867], Warangal: [17.9689, 79.5941], Karimnagar: [18.4386, 79.1288],
    Nizamabad: [18.6725, 78.0941], Khammam: [17.2473, 80.1514], Adilabad: [19.6641, 78.532],
    Bhadrachalam: [17.6688, 80.8936], Mahbubnagar: [16.7488, 78.0035], Nalgonda: [17.0575, 79.2684],
  };
  const outside = {
    Vijayawada: [16.5062, 80.648], Kurnool: [15.8281, 78.0373], Nanded: [19.1383, 77.321],
    Bidar: [17.9104, 77.5199], Guntur: [16.3067, 80.4365], Chandrapur: [19.9615, 79.2961],
    // Moved to Andhra Pradesh in 2014.
    Chintoor: [17.751, 81.393], Kunavaram: [17.586, 81.272],
  };
  for (const [name, [lat, lng]] of Object.entries(inside)) assert.ok(inTelangana({ lat, lng }), name);
  for (const [name, [lat, lng]] of Object.entries(outside)) assert.ok(!inTelangana({ lat, lng }), name);
  assert.ok(!inTelangana({}));
  assert.ok(!inTelangana({ lat: "17.4", lng: "78.4" }));
});

test("the client uses the same outline", () => {
  const read = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");
  assert.equal(read("../../client/src/lib/telangana.json"), read("../src/lib/telangana.json"));
});
