import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const GSI_SRC = "https://accounts.google.com/gsi/client";

const LOAD_FAILED = "Couldn't load Google sign-in. Check your connection and reopen this window.";

// Google's script may only be initialised once per page, so these live at
// module level and each button swaps in its own handler.
let setup = null;
let initialised = false;
let handleCredential = null;

/** Adds Google's script to the page (once) and waits for it, for up to 15s. */
function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    let script = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    const timer = setTimeout(() => reject(new Error(LOAD_FAILED)), 15000);
    script.addEventListener(
      "load",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error(LOAD_FAILED));
      },
      { once: true }
    );
  });
}

/** Resolves to the Google client id (or null when the server has none). */
function prepareGoogle() {
  if (!setup) {
    setup = api("/config").then(async ({ googleClientId }) => {
      if (!googleClientId) return null;
      await loadScript();
      if (!initialised) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => handleCredential?.(response.credential),
          ux_mode: "popup",
          context: "signin",
        });
        initialised = true;
      }
      return googleClientId;
    });
    // Let the next open retry after a failure.
    setup.catch(() => {
      setup = null;
    });
  }
  return setup;
}

/**
 * Google's own "Sign in with Google" button. Calls `onCredential` with the
 * ID token Google returns, which the server verifies.
 */
export default function GoogleButton({ mode = "signin", onCredential, disabled }) {
  const slot = useRef(null);
  const [state, setState] = useState("loading");
  const [problem, setProblem] = useState("");

  useEffect(() => {
    handleCredential = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let live = true;
    prepareGoogle()
      .then((clientId) => {
        if (!live) return;
        if (!clientId) return setState("off");
        const width = Math.min(400, Math.max(200, Math.floor(slot.current.offsetWidth)));
        window.google.accounts.id.renderButton(slot.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: mode === "signup" ? "signup_with" : "signin_with",
          logo_alignment: "center",
          width,
        });
        setState("ready");
      })
      .catch((err) => {
        if (!live) return;
        setProblem(err.message);
        setState("error");
      });
    return () => {
      live = false;
    };
  }, [mode]);

  // Without a client id there's nothing to click; tell developers how to fix that.
  if (state === "off") {
    return import.meta.env.DEV ? (
      <p className="google-note">
        Google sign-in is off. Add <code>GOOGLE_CLIENT_ID</code> to <code>server/.env</code> to turn it on.
      </p>
    ) : null;
  }

  return (
    <div className={`google-wrap ${disabled ? "is-busy" : ""}`}>
      <div ref={slot} className="google-slot" aria-busy={state === "loading"} />
      {state === "loading" && <div className="google-placeholder" aria-hidden="true" />}
      {state === "error" && <p className="google-note">{problem}</p>}
    </div>
  );
}
