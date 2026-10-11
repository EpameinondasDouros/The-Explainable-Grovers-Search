"""The Qiskit circuit the game sends to the backend must produce Grover's probabilities, and the upload
bundle must be one self-contained script."""

import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

HERE = Path(__file__).parent
SCRIPT = HERE / "quantum_check.mjs"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="node is not installed")

CASES = [(2, 3, 1), (4, 5, 0), (4, 5, 3), (4, 0, 2), (4, 15, 8), (6, 42, 6), (6, 0, 1)]


def run_js() -> dict:
    proc = subprocess.run(
        [NODE, str(SCRIPT)], input=json.dumps({"cases": CASES}), capture_output=True, text=True,
        timeout=60, check=False,
    )
    if proc.returncode != 0:
        pytest.skip(f"node could not import quantum.js: {proc.stderr[-300:]}")
    return json.loads(proc.stdout.strip().splitlines()[-1])


@pytest.fixture(scope="module")
def js():
    return run_js()


def numpy_probs(n_items: int, target: int, k: int) -> np.ndarray:
    psi = np.full(n_items, 1 / math.sqrt(n_items))
    for _ in range(k):
        psi[target] *= -1
        psi = 2 * psi.mean() - psi
    return psi**2


@pytest.mark.parametrize("i", range(len(CASES)))
def test_qiskit_circuit_matches_grover(js, i):
    qiskit = pytest.importorskip("qiskit")
    from qiskit.quantum_info import Statevector

    n, target, k = CASES[i]
    qc = qiskit.QuantumCircuit(n)
    for op in js["ops"][i]:
        gate, args = op[0], op[1:]
        if gate == "mcx":
            qc.mcx(args[0], args[1])
        elif gate == "barrier":
            qc.barrier()
        else:
            getattr(qc, gate)(args[0])
    # Statevector index i is the integer whose bit q is qubit q: the same order as the counts keys.
    got = Statevector(qc).probabilities()
    assert np.allclose(got, numpy_probs(2**n, target, k), atol=1e-9)


def test_parse_counts(js):
    assert js["parsed"] == [[[5, 3], [15, 2]], [[3, 4]]]


def test_adapter_uses_backend_with_kwargs(js):
    on = js["online"]
    assert on["ready"] is True and on["name"] == "mock_sim"
    assert on["statuses"] == ["online"]
    assert on["run"]["counts"] == [[5, 25]]
    assert on["run"]["stats"] == {"qubits": 4, "depth": 7, "gates": 42}
    assert on["calls"][0] == ["transpile", 1]
    assert on["calls"][1][:2] == ["run", 25]


def test_adapter_offline_falls_back(js):
    off = js["offline"]
    assert off["ready"] is False and off["state"] == "offline"
    assert "Qiskit is not available" in off["error"]


def test_bundle_is_self_contained(tmp_path):
    sys.path.insert(0, str(HERE.parent))
    from build import bundle

    for static in (False, True):
        js = bundle(static_qiskit=static)
        assert "from './" not in js
        assert "export " not in js
        assert ("from 'qiskit'" in js) is static
        path = tmp_path / ("main.mjs" if static else "main.js")
        path.write_text(js)
        check = subprocess.run([NODE, "--check", str(path)], capture_output=True, text=True, check=False)
        assert check.returncode == 0, check.stderr
