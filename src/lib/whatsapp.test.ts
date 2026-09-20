import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  DEFAULT_WHATSAPP_GREETING,
  FALLBACK_WHATSAPP_NUMBER,
  toIndiaWhatsAppNumber,
  whatsAppGreeting,
  whatsAppNumber,
  whatsAppUrl,
} from "@/lib/whatsapp";

/**
 * The link the floating button publishes.
 *
 * Worth testing on its own because every way it can be wrong is silent: a
 * mis-normalized number opens WhatsApp on a chat with nobody, and a
 * mis-encoded message arrives with the punctuation mangled. Neither throws,
 * and neither shows up in a build.
 *
 * Nothing here contacts WhatsApp.
 */

const ENV_NUMBER = "NEXT_PUBLIC_WHATSAPP_NUMBER";
const ENV_MESSAGE = "NEXT_PUBLIC_WHATSAPP_MESSAGE";

afterEach(() => {
  delete process.env[ENV_NUMBER];
  delete process.env[ENV_MESSAGE];
});

describe("toIndiaWhatsAppNumber", () => {
  it("adds the country code to a bare subscriber number", () => {
    assert.equal(toIndiaWhatsAppNumber("9974959693"), "919974959693");
  });

  it("accepts a number that already carries it", () => {
    assert.equal(toIndiaWhatsAppNumber("919974959693"), "919974959693");
  });

  it("accepts the ways a person actually writes one", () => {
    // Each of these is what someone might paste into a settings field.
    for (const written of [
      "+91 99749 59693",
      "+919974959693",
      "99749 59693",
      "99749-59693",
      "(+91) 9974959693",
      "0 9974959693",
      "09974959693",
    ]) {
      assert.equal(
        toIndiaWhatsAppNumber(written),
        "919974959693",
        `failed on ${written}`
      );
    }
  });

  it("refuses what it cannot be sure of", () => {
    // Returning null lets the caller fall back to the shipped number rather
    // than publish a link to a chat that does not exist.
    for (const bad of [
      "",
      "   ",
      "abc",
      "12345",
      "99749596931234",
      // Another country's code; this normalizer is India-only and says so.
      "442079460000",
      null,
      undefined,
    ]) {
      assert.equal(toIndiaWhatsAppNumber(bad), null, `accepted ${String(bad)}`);
    }
  });
});

describe("whatsAppNumber", () => {
  it("uses the configured number", () => {
    process.env[ENV_NUMBER] = "+91 98765 43210";
    assert.equal(whatsAppNumber(), "919876543210");
  });

  it("falls back when the variable is missing", () => {
    delete process.env[ENV_NUMBER];
    assert.equal(whatsAppNumber(), "91" + FALLBACK_WHATSAPP_NUMBER);
  });

  it("falls back when the variable is empty", () => {
    // A deployment that declared the variable without filling it in. Treating
    // blank as configured would ship a button to nowhere.
    process.env[ENV_NUMBER] = "   ";
    assert.equal(whatsAppNumber(), "919974959693");
  });

  it("falls back when the variable is unusable", () => {
    process.env[ENV_NUMBER] = "not-a-number";
    assert.equal(whatsAppNumber(), "919974959693");
  });
});

describe("whatsAppGreeting", () => {
  it("is the shipped wording by default", () => {
    assert.equal(whatsAppGreeting(), DEFAULT_WHATSAPP_GREETING);
    assert.ok(whatsAppGreeting().startsWith("Hi MAK Watches!"));
  });

  it("is overridable per environment", () => {
    // The WhatsApp Business auto-reply rule matches this text, so it has to be
    // configurable without a code change.
    process.env[ENV_MESSAGE] = "Hi MAK Watches, I have a question about an order.";
    assert.equal(whatsAppGreeting(), "Hi MAK Watches, I have a question about an order.");
  });

  it("ignores a blank override", () => {
    process.env[ENV_MESSAGE] = "  ";
    assert.equal(whatsAppGreeting(), DEFAULT_WHATSAPP_GREETING);
  });
});

describe("whatsAppUrl", () => {
  it("builds WhatsApp's documented send link", () => {
    delete process.env[ENV_NUMBER];

    const url = new URL(whatsAppUrl());
    assert.equal(url.origin + url.pathname, "https://api.whatsapp.com/send");
    assert.equal(url.searchParams.get("phone"), "919974959693");
    // Read back through the parser rather than compared to a hand-encoded
    // string: the greeting carries an emoji and a typographic apostrophe, and
    // asserting their escape sequences would test my encoding of the assertion
    // rather than the encoding of the link.
    assert.equal(url.searchParams.get("text"), DEFAULT_WHATSAPP_GREETING);
  });

  it("is never a tel: link", () => {
    // A tel: URL places a phone call, which reaches a different inbox than the
    // one the auto-replies are configured on.
    const url = whatsAppUrl();
    assert.ok(url.startsWith("https://api.whatsapp.com/send?"), url);
    assert.ok(!url.includes("tel:"), url);
    assert.ok(!url.includes("wa.me"), url);
  });

  it("encodes the shipped greeting's emoji and punctuation", () => {
    // A waving hand is a surrogate pair and the apostrophe is U+2019; both have
    // to survive as themselves rather than as "?" or a mojibake pair.
    const text = new URL(whatsAppUrl()).searchParams.get("text") ?? "";
    assert.ok(text.includes("\u{1F44B}"), "the emoji was lost");
    assert.ok(text.includes("’"), "the typographic apostrophe was lost");
    assert.ok(whatsAppUrl().includes("%F0%9F%91%8B"), "the emoji was not percent-encoded");
  });

  it("encodes the message so it survives the round trip", () => {
    const message = "Hi MAK Watches, I need help with a watch & a strap (₹5,895)?";
    const url = new URL(whatsAppUrl({ message }));

    assert.equal(url.searchParams.get("text"), message);
    // Spaces as %20, not +: both are legal, WhatsApp's clients have not always
    // agreed, and a literal plus in a greeting is a confusing bug to chase.
    assert.ok(!url.search.includes("+"), url.search);
  });

  it("carries the configured number", () => {
    process.env[ENV_NUMBER] = "+91 98765 43210";
    assert.equal(new URL(whatsAppUrl()).searchParams.get("phone"), "919876543210");
  });

  it("sends the number in international format, with no plus", () => {
    // WhatsApp addresses a chat by digits only; a leading + produces a link
    // that opens on an empty conversation.
    const phone = new URL(whatsAppUrl()).searchParams.get("phone") ?? "";
    assert.match(phone, /^\d{12}$/);
    assert.ok(phone.startsWith("91"), phone);
  });
});
