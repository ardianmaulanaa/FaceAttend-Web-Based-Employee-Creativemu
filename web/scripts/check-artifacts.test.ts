import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = join(process.cwd(), "scripts/check-artifacts.sh");

function makeTempRepo() {
  const repo = mkdtempSync(join(tmpdir(), "face-attend-artifacts-"));
  const scriptsDir = join(repo, "scripts");

  mkdirSync(scriptsDir);
  copyFileSync(scriptPath, join(scriptsDir, "check-artifacts.sh"));
  execFileSync("git", ["init"], { cwd: repo, stdio: "ignore" });

  return repo;
}

function runCheck(repo: string) {
  return execFileSync("bash", ["scripts/check-artifacts.sh"], {
    cwd: repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

describe("artifact safety script", () => {
  it("passes for a clean repository", () => {
    const repo = makeTempRepo();

    expect(runCheck(repo)).toContain("Artifact safety checks passed.");
  });

  it("fails when uploaded user files are tracked", () => {
    const repo = makeTempRepo();
    const uploadPath = join(repo, "public/uploads/profiles/user.jpg");

    mkdirSync(join(repo, "public/uploads/profiles"), { recursive: true });
    writeFileSync(uploadPath, "fake image");
    execFileSync("git", ["add", "public/uploads/profiles/user.jpg"], {
      cwd: repo,
    });

    expect(() => runCheck(repo)).toThrow(/public\/uploads/);
  });

  it("fails when deployment zip contains environment files", () => {
    const repo = makeTempRepo();

    writeFileSync(join(repo, ".env"), "JWT_SECRET=secret-value");
    execFileSync("zip", ["-qr", "deploy.zip", ".env"], { cwd: repo });

    expect(() => runCheck(repo)).toThrow(/environment files/);
  });
});
