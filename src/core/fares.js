// Namma Metro fare slabs (official BMRCL, 2024)
// Based on number of stations travelled
/**
 * Routing module — Namma Metro fare lookup (official BMRCL 2024 slabs).
 * @param {number} stopCount - number of stations travelled
 * @returns {{normal:number, smart:number}} fare in INR, standard vs. smart-card
 * @complexity O(1) — fixed tier comparisons.
 * @sideEffects None.
 */
export function calcFare(stopCount) {
  if (stopCount <= 0)  return { normal: 10,  smart: 10  };
  if (stopCount <= 2)  return { normal: 10,  smart: 10  };
  if (stopCount <= 5)  return { normal: 20,  smart: 18  };
  if (stopCount <= 8)  return { normal: 30,  smart: 27  };
  if (stopCount <= 12) return { normal: 40,  smart: 36  };
  if (stopCount <= 16) return { normal: 50,  smart: 45  };
  if (stopCount <= 21) return { normal: 60,  smart: 54  };
  return                      { normal: 70,  smart: 63  };
}
