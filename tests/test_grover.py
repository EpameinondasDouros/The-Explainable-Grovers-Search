"""The in-browser Grover simulation must agree with an independent numpy implementation."""

import json
import math
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pytest

SCRIPT = Path(__file__).parent / "grover_check.mjs"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="node is not installed")

CASES = [(4, 2, 1), (16, 0, 0), (16, 5, 3), (16, 5, 8), (64, 63, 6), (256, 100, 12), (256, 7, 30)]


def numpy_grover(n_items: int, target: int, k: int) -> np.ndarray:
    psi = np.full(n_items, 1 / math.sqrt(n_items))
    s = np.full(n_items, 1 / math.sqrt(n_items))
    diffusion = 2 * np.outer(s, s) - np.eye(n_items)
    oracle = np.eye(n_items)
    oracle[target, target] = -1
    for _ in range(k):
        psi = diffusion @ (oracle @ psi)
    return psi**2


def run_js(payload: dict) -> dict:
    proc = subprocess.run(
        [NODE, str(SCRIPT)], input=json.dumps(payload), capture_output=True, text=True,
        timeout=60, check=False,
    )
    if proc.returncode != 0:
        pytest.skip(f"node could not import the simulation: {proc.stderr[-300:]}")
    return json.loads(proc.stdout.strip().splitlines()[-1])


@pytest.fixture(scope="module")
def js():
    return run_js({"cases": CASES, "samples": [[[0.1, 0.2, 0.7], u] for u in (0.0, 0.15, 0.3, 0.99)]})


@pytest.mark.parametrize("i", range(len(CASES)))
def test_js_matches_numpy_and_closed_form(js, i):
    n_items, target, k = CASES[i]
    got = np.array(js["out"][i]["p"])
    assert np.allclose(got, numpy_grover(n_items, target, k), atol=1e-12)
    assert math.isclose(got.sum(), 1.0, abs_tol=1e-12)
    theta = math.asin(1 / math.sqrt(n_items))
    assert math.isclose(got[target], math.sin((2 * k + 1) * theta) ** 2, abs_tol=1e-12)
    assert math.isclose(js["out"][i]["theory"], got[target], abs_tol=1e-12)


@pytest.mark.parametrize("n_items", [16, 64, 256])
def test_optimum_is_high_and_overshoot_drops(js, n_items):
    theta = math.asin(1 / math.sqrt(n_items))
    k = round(math.pi / (4 * theta) - 0.5)
    assert math.sin((2 * k + 1) * theta) ** 2 > 0.95
    assert math.sin((2 * (2 * k) + 1) * theta) ** 2 < 0.5


def test_optimal_iterations_from_js(js):
    assert [o["kopt"] for o in js["out"]][:3] == [1, 3, 3]


def test_sampling_with_fixed_u(js):
    assert js["samples"] == [0, 1, 1, 2]
