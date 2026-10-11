"""Build the upload folder: dist/ with index.html, main.js and main.css, plus dist.zip.

The platform runs a project from index.html + main.js (main.css is added automatically), and may not
serve sibling files, so the ES modules in js/ are bundled into one self-contained main.js. Each module
becomes a function scope; `import { a } from './x.js'` reads from that scope; no dependencies needed.

    python3 build.py                  # dynamic import('qiskit'), falls back to the exact simulation
    python3 build.py --static-qiskit  # also adds `import { QuantumCircuit } from 'qiskit'`, as in the
                                      # platform template, for hosts that only resolve static imports
"""

import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
IMPORT = re.compile(r"^import\s*\{([^}]*)\}\s*from\s*'\./([\w-]+)\.js';\n", re.M)
EXPORT = re.compile(r"^export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+(\w+)", re.M)


def modules_in_order(entry: str) -> list[str]:
    """Depth-first over relative imports, dependencies first."""
    order: list[str] = []

    def visit(name: str, path: tuple[str, ...]) -> None:
        if name in order:
            return
        if name in path:
            raise SystemExit(f"import cycle: {' -> '.join(path + (name,))}")
        for _, dep in IMPORT.findall((ROOT / "js" / f"{name}.js").read_text()):
            visit(dep, path + (name,))
        order.append(name)

    visit(entry, ())
    return order


def bundle(static_qiskit: bool = False) -> str:
    out = [
        "// The Explainable Grover's Search: bundled by build.py from js/*.js. Edit those, not this file.",
    ]
    if static_qiskit:
        out.append("import { QuantumCircuit as __QuantumCircuit } from 'qiskit';")
        out.append("globalThis.__groverQiskit = { QuantumCircuit: __QuantumCircuit };")
    # Runs once even if the host both injects main.js and loads it from index.html's <script> tag.
    out.append("(() => {\n'use strict';\nif (globalThis.__groverBooted) return;\nglobalThis.__groverBooted = true;\n")
    for name in modules_in_order("main"):
        src = (ROOT / "js" / f"{name}.js").read_text()
        imports = "".join(
            f"const {{{' '.join(names.split())}}} = __{dep};\n" for names, dep in IMPORT.findall(src)
        )
        body = EXPORT.sub(lambda m: m.group(0).replace("export ", "", 1), IMPORT.sub("", src))
        exports = EXPORT.findall(src)
        out.append(f"// ---- js/{name}.js\nconst __{name.replace('-', '_')} = (() => {{\n{imports}{body}\nreturn {{ {', '.join(exports)} }};\n}})();\n")
    out.append("})();\n")
    js = "\n".join(out)
    if static_qiskit:
        # prefer the statically imported module over import('qiskit')
        js = js.replace("loadQiskit = () => import('qiskit')", "loadQiskit = async () => globalThis.__groverQiskit")
    return js


def build(static_qiskit: bool = False) -> Path:
    DIST.mkdir(exist_ok=True)
    for stale in DIST.iterdir():
        stale.unlink()
    (DIST / "main.js").write_text(bundle(static_qiskit))
    (DIST / "index.html").write_text((ROOT / "index.html").read_text())
    (DIST / "main.css").write_text((ROOT / "main.css").read_text())
    with zipfile.ZipFile(ROOT / "dist.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DIST.iterdir()):
            z.write(f, f.name)
    return DIST


if __name__ == "__main__":
    out = build(static_qiskit="--static-qiskit" in sys.argv)
    for f in sorted(out.iterdir()):
        print(f"{f.relative_to(ROOT)}  {f.stat().st_size / 1024:.1f} KB")
    print("dist.zip")
